import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { buildModel } from "../config/model";
import { log } from "../utils/logger";
import { z } from "zod";
import {
  getAppById,
  getAppData,
  getAppChatHistory,
  upsertAppData,
  AppRow,
  AppDataRow,
} from "../services/app.service";

// ─── Graph State ─────────────────────────────────────────────────────────────

export const AppGraphStateAnnotation = Annotation.Root({
  appId: Annotation<string>(),
  userId: Annotation<string>(),
  app: Annotation<AppRow>(),
  appData: Annotation<AppDataRow[]>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage | BaseMessage[]) => {
      const added = Array.isArray(y) ? y : [y];
      return x.concat(added);
    },
    default: () => [],
  }),
  dataUpdates: Annotation<any[]>({
    reducer: (x: any[], y: any[]) => x.concat(y),
    default: () => [],
  }),
  reply: Annotation<string>(),
  parsedType: Annotation<string>(),
});

export type AppGraphState = typeof AppGraphStateAnnotation.State;

// ─── Extracted Logic / Helper Functions ──────────────────────────────────────

const buildAppSystemPrompt = (app: AppRow, appData: AppDataRow[]): string => {
  const dataSection =
    appData.length > 0
      ? appData
          .map((d) => `${d.key}: ${JSON.stringify(d.value, null, 2)}`)
          .join("\n\n")
      : "(No data yet)";

  return `
You are an AI assistant operating inside an application called "${app.name}".
${app.description ? `App Description: ${app.description}` : ""}

YOUR CAPABILITIES (VERY IMPORTANT):
You are a FULLY CAPABLE assistant for this app. You can handle ANY request the user makes by updating app_data via data_updates. This includes but is not limited to:
- Generating invoices, documents, reports, letters, contracts — as rich Markdown
- Managing lists (todos, recipes, contacts, inventory) — as arrays
- Tracking data (expenses, budgets, scores, habits) — as arrays or objects
- Computing totals, balances, summaries — store results in data keys
- Creating and formatting any content the user asks for

ABSOLUTE RULE: NEVER say "I don't have tools", "I can't process", "I'm unable to", or "I don't have the capability". You DO have the capability — you update app_data. If the user asks you to do something, DO IT by returning a data_update response.

CORE RULES:
- The app schema defines the UI layout and components. NEVER modify the schema.
- app_data is the single source of truth for this app's state.
- Use the provided app data to understand the current state before responding.
- When the user requests an action that changes data, you MUST return a data_updates array.
- Keep responses concise and helpful.
- The members list is managed automatically by the system (from the app_members table). Do NOT update members_list in app_data. Only manage non-member data keys.

HOW THE UI WORKS:
- Schema components are DISPLAY-ONLY cards. They show data from app_data. They are NOT interactive forms or clickable buttons.
- There are no input fields, dropdowns, or submit buttons in the UI. ALL user interaction happens through THIS CHAT.
- NEVER tell the user to "fill in a form", "click a button", or "submit". Instead, ask the user to tell you the information in chat, then YOU update the data.
- When components show "No data", it means you need to populate them via data_updates when the user provides information.

PREVIEW / VIEWER / DOCUMENT COMPONENTS (CRITICAL):
- Any component whose name contains "preview", "viewer", "markdown", or "document" is a RENDERED DISPLAY component. It shows rich Markdown content to the user.
- Whenever you update data in this app, you MUST ALSO update the preview/viewer/document component with a fully formatted Markdown string that reflects the current state of ALL the app's data.
- For example, in an invoice app: every time items, client details, or any data changes, regenerate the full invoice as a Markdown string and include it in data_updates for the preview component.
- The preview component should contain a COMPLETE, beautifully formatted document — not just a summary. Use Markdown headers, tables, bold text, line breaks, etc.
- NEVER leave a preview/viewer/document component empty when there is data to display.

APP SCHEMA:
${JSON.stringify(app.schema, null, 2)}

CURRENT APP DATA:
${dataSection}

RESPONSE FORMAT (CRITICAL):
You MUST return a RAW JSON object in one of these formats. Do NOT use markdown backticks.

1. When you need to update app data:
{
  "type": "data_update",
  "message": "Description of what was done",
  "data_updates": [
    { "key": "some_key", "value": "..." }
  ]
}

2. When you need clarification:
{
  "type": "clarification",
  "question": "What did you mean?",
  "options": ["Option A", "Option B"]
}

3. When you provide a final response (no data changes):
{
  "type": "final",
  "message": "Your response here"
}

IMPORTANT RULES:
- For data_updates, always include the FULL updated value for each key, not just the diff. When updating a list, include the ENTIRE list with the changes applied.
- If a key doesn't exist yet in app_data, you can create it.
- When generating documents, reports, or invoices, use rich Markdown formatting (headers, tables, bold, etc.) in the data value so it renders beautifully in the UI.
- Never include raw UUIDs or system details in your message to the user.
- If the user's request is ambiguous, ask for clarification.
- Prefer "data_update" responses over "final" whenever the user asks you to create, generate, add, update, or change anything.
- When the user says "create new", "start fresh", "new invoice", "reset", or similar, clear the relevant data keys (set arrays to [], objects to {}, strings to "") and start from scratch.
- When the user asks to UPDATE existing data (change price, add item, remove item, edit details), merge the changes into the EXISTING data — do NOT discard what was there.
`.trim();
};

const DISPLAY_COMPONENT_PATTERN =
  /preview|viewer|markdown|document|report|summary_view/i;

const getDisplayComponents = (schema: Record<string, unknown>): string[] => {
  const layout = schema?.layout;
  if (!Array.isArray(layout)) return [];
  return layout
    .map((item: Record<string, unknown>) => item.component as string)
    .filter((name: string) => DISPLAY_COMPONENT_PATTERN.test(name));
};

const titleFromKey = (key: string): string =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const toDisplayValue = (value: unknown): string => {
  if (typeof value === "number")
    return Number.isFinite(value) ? value.toFixed(2) : String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "";
  return String(value);
};

const buildTableMarkdown = (rows: Array<Record<string, unknown>>): string => {
  if (rows.length === 0) return "";
  const cols = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );
  if (cols.length === 0) return "";
  const header = `| # | ${cols.map(titleFromKey).join(" | ")} |`;
  const divider = `|---|${cols.map(() => "---").join("|")}|`;
  const body = rows
    .map((row, i) => {
      const cells = cols.map((c) => toDisplayValue(row[c]));
      return `| ${i + 1} | ${cells.join(" | ")} |`;
    })
    .join("\n");
  return `${header}\n${divider}\n${body}`;
};

const buildDeterministicDisplayMarkdown = (
  app: AppRow,
  data: Record<string, unknown>,
  displayComponents: Set<string>,
): string => {
  const parts: string[] = [];
  parts.push(`# ${app.name}`);
  parts.push("");
  parts.push(`**Date:** ${new Date().toISOString().slice(0, 10)}`);

  for (const [key, value] of Object.entries(data)) {
    if (displayComponents.has(key)) continue;
    if (/member/i.test(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    ) {
      continue;
    }

    parts.push("");
    parts.push(`## ${titleFromKey(key)}`);
    parts.push("");

    if (Array.isArray(value)) {
      if (typeof value[0] === "object" && value[0] !== null) {
        parts.push(buildTableMarkdown(value as Array<Record<string, unknown>>));
      } else {
        for (const item of value) parts.push(`- ${toDisplayValue(item)}`);
      }
      continue;
    }

    if (typeof value === "object" && value !== null) {
      for (const [objKey, objValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        parts.push(`**${titleFromKey(objKey)}:** ${toDisplayValue(objValue)}`);
      }
      continue;
    }

    parts.push(toDisplayValue(value));
  }

  return parts.join("\n").trim();
};

const StructuredDataUpdateSchema = z.object({
  key: z.string(),
  value: z.unknown(),
});

const StructuredAppResponseSchema = z
  .object({
    type: z.enum(["final", "clarification", "data_update"]),
    message: z.string().optional(),
    question: z.string().optional(),
    options: z.array(z.string()).optional(),
    data_updates: z.array(StructuredDataUpdateSchema).optional(),
  })
  .passthrough();

const normalizeReplyForChat = (
  message: string,
  updates: any[] | undefined,
  displayComponents: string[],
): string => {
  const base = (message || "I processed your request.").trim();
  const m = base.toLowerCase();
  const promisesInline =
    /\bhere(?:'s| is)\b/.test(m) ||
    /\bupdated\b.*\b(plan|bill|invoice|report|document|summary|itinerary)\b/.test(
      m,
    ) ||
    /\b(plan|bill|invoice|report|document|summary|itinerary)\b.*\bbelow\b/.test(
      m,
    ) ||
    m.includes("see below") ||
    m.includes("as follows");

  const alreadyHasInline = /\n\s*#\s+/.test(base) || /\n\s*\|.+\|/.test(base);

  if (!promisesInline || alreadyHasInline) {
    return base;
  }

  if (updates?.length && displayComponents.length > 0) {
    const displaySet = new Set(displayComponents);
    const hit = updates.find(
      (u) =>
        displaySet.has(u.key) && typeof u.value === "string" && u.value.trim(),
    );
    if (hit) return `${base}\n\n${(hit.value as string).trim()}`;
  }

  return base
    .replace(/:\s*$/, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
};

// ─── Nodes ───────────────────────────────────────────────────────────────────

export const loadAppContextNode = async (state: AppGraphState) => {
  const [app, appData, recentChats] = await Promise.all([
    getAppById(state.appId),
    getAppData(state.appId),
    getAppChatHistory(state.appId, state.userId, 20),
  ]);

  if (!app) {
    throw new Error("App not found");
  }

  const systemPrompt = buildAppSystemPrompt(app, appData);
  const historyMessages = recentChats.map((c: any) =>
    c.role === "user" ? new HumanMessage(c.message) : new AIMessage(c.message),
  );

  return {
    app,
    appData,
    messages: [
      new SystemMessage(systemPrompt),
      ...historyMessages,
      ...state.messages,
    ],
  };
};

export const generateUpdateNode = async (state: AppGraphState) => {
  const llm = buildModel();

  try {
    const structuredLlm = (llm as any).withStructuredOutput(
      StructuredAppResponseSchema,
    );
    const result = await structuredLlm.invoke(state.messages);

    let type = result.type;
    let message = result.message || "";
    let updates = result.data_updates || [];

    if (type === "clarification") {
      message = JSON.stringify(result);
    }

    return {
      parsedType: type,
      reply: message,
      dataUpdates: updates,
    };
  } catch (error) {
    log({
      event: "app_generate_update_failed",
      error: String(error),
    });

    // Fallback simple unstructured string output logic
    const response = await llm.invoke(state.messages);
    return {
      parsedType: "final",
      reply: String(response.content),
    };
  }
};

export const saveUpdateNode = async (state: AppGraphState) => {
  if (
    state.parsedType === "data_update" &&
    state.dataUpdates &&
    state.dataUpdates.length > 0
  ) {
    const additionalUpdates = [];

    for (const update of state.dataUpdates) {
      await upsertAppData(state.appId, update.key, update.value);
    }

    const displayComponents = getDisplayComponents(state.app?.schema || {});
    if (displayComponents.length > 0) {
      const updatedKeys = new Set(state.dataUpdates.map((u: any) => u.key));
      const missedDisplays = displayComponents.filter(
        (c) => !updatedKeys.has(c),
      );

      if (missedDisplays.length > 0) {
        const freshData = await getAppData(state.appId);
        const currentDataMap: Record<string, unknown> = {};
        for (const row of freshData) {
          currentDataMap[row.key] = row.value;
        }

        const markdown = buildDeterministicDisplayMarkdown(
          state.app as AppRow,
          currentDataMap,
          new Set(displayComponents),
        );

        if (markdown) {
          for (const displayKey of missedDisplays) {
            await upsertAppData(state.appId, displayKey, markdown);
            additionalUpdates.push({ key: displayKey, value: markdown });
          }
        }
      }
    }

    return {
      dataUpdates: additionalUpdates,
    };
  }

  return {};
};

export const respondNode = async (state: AppGraphState) => {
  const displayComponents = getDisplayComponents(state.app?.schema || {});
  const replyText = normalizeReplyForChat(
    state.reply || "I processed your request.",
    state.dataUpdates,
    displayComponents,
  );

  return {
    reply: replyText,
  };
};

const appGraphBuilder = new StateGraph(AppGraphStateAnnotation)
  .addNode("loadAppContext", loadAppContextNode)
  .addNode("generateUpdate", generateUpdateNode)
  .addNode("saveUpdate", saveUpdateNode)
  .addNode("respond", respondNode)
  .addEdge(START, "loadAppContext")
  .addEdge("loadAppContext", "generateUpdate")
  .addEdge("generateUpdate", "saveUpdate")
  .addEdge("saveUpdate", "respond")
  .addEdge("respond", END);

export const appGraph = appGraphBuilder.compile();
