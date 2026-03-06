import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { buildModel } from "../config/model";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { log } from "../utils/logger";

const prettifySchema = z.object({
  user_query: z
    .string()
    .describe("The original question or request from the user"),
  raw_data: z
    .string()
    .describe("The raw result(s) returned by the previously executed tool(s)"),
});

/**
 * Prettify Tool: Converts raw data into a polished, human-friendly response.
 * This is used to ensure tool outputs (like numbers or raw API responses)
 * are presented gracefully in the Chief of AI tone.
 */
export const prettifyResponseTool = tool(
  async ({
    user_query,
    raw_data,
  }: {
    user_query: string;
    raw_data: string;
  }): Promise<string> => {
    log({
      event: "tool_execution_started",
      toolName: "prettify_response",
      args: { user_query, raw_data },
    });
    // We use a clean LLM call (no tools bound) to transform the raw data
    const llm = buildModel();

    const response = await llm.invoke([
      new SystemMessage(`
        You are a Response Prettifier for Chief of AI.
        Your job is to take raw tool output and the user's original query, then combine them into a single, polished, and professional sentence or two.
        
        RULES:
        - Maintain a professional yet helpful tone.
        - Be concise and do not add fluff.
        - CRITICAL: NEVER include any raw database IDs, UUIDs, internal identifiers, or access codes in your response.
        - CRITICAL: Hide any technical database confirmations. If the raw data says "Memory added successfully. ID: 1234-5678", you should simply say "I have saved that memory for you."
        - CRITICAL: If the raw data is a structured guide or list of capabilities (like the help menu), RETURN IT EXACTLY format-for-format without summarizing or chopping it down.
        - Ensure the answer to the user's query is prominent and natural.
      `),
      new HumanMessage(`User Query: ${user_query}\nRaw Data: ${raw_data}`),
    ]);

    return typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);
  },
  {
    name: "prettify_response",
    description:
      "Call this to format raw data/numbers into a nice human-readable message before giving the final answer.",
    schema: prettifySchema,
  },
);
