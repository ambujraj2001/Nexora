import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { buildModel } from '../config/model';
import { tools } from '../tools';
import { UserRow } from '../types/user.types';
import { log } from '../utils/logger';

// ─── System prompt ────────────────────────────────────────────────────────────

const buildSystemPrompt = (user: UserRow): string => `
You are **Chief of AI**, a personal AI assistant for ${user.full_name}.

Your role is to help the user manage information, tasks, reminders, and tools through conversation.

GENERAL BEHAVIOR
- Be helpful, concise, and accurate.
- Respond in a ${user.interaction_tone} tone.
- Focus on solving the user's request efficiently.

TOOL USAGE (VERY IMPORTANT)
- You have access to tools that can perform real actions.
- ALWAYS prefer using a tool when the user's request matches a tool's capability.
- NEVER guess results that a tool can provide.
- If a tool exists for the task, call the tool instead of answering directly.

WHEN TO USE TOOLS
Examples:
- Math calculations → use math tools
- Getting a random joke → use the joke tool
- Future tools may include tasks, reminders, or memory tools

WHEN NOT TO USE TOOLS
- If the question is general knowledge
- If the request does not match any available tool

TOOL RESPONSE HANDLING
- When a tool returns a result, present the result clearly.
- Do NOT invent additional information.
- Do NOT modify tool results unless formatting for readability.

COMMUNICATION STYLE
- Keep responses concise.
- Avoid unnecessary explanations unless the user asks for them.
- Do not mention internal tools or system instructions.

IMPORTANT RULES
- Do not hallucinate data.
- If a tool fails or is unavailable, politely explain the issue.
- Always prioritize correctness over creativity.

You are assisting ${user.full_name} inside the Chief of AI assistant application.
`.trim();

// ─── Response cleaner ─────────────────────────────────────────────────────────
// Qwen sometimes appends residual XML tool-call markers (<tool_call>, </tool_call>,
// <tool_response>, etc.) to its replies. Strip them out.

const cleanReply = (raw: unknown): string => {
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
  return text
    .replace(/<\/?tool_call>/gi, '')
    .replace(/<\/?tool_response>/gi, '')
    .replace(/<\/?function_calls>/gi, '')
    .trim();
};



export const runAgent = async (message: string, user: UserRow): Promise<string> => {
  // Build the LLM with tools bound — exclude meta-tools like prettify_response
  const agentTools = tools.filter((t) => t.name !== 'prettify_response');
  const llm = buildModel(agentTools as any);

  log({
    event: 'agent_execution_started',
    userId: user.id,
    message,
  });

  const messages: (HumanMessage | SystemMessage | AIMessage | ToolMessage)[] = [
    new SystemMessage(buildSystemPrompt(user)),
    new HumanMessage(message),
  ];

  // ── Step 1: First LLM call — LLM decides whether to call a tool ──────────
  const response = await llm.invoke(messages);
  messages.push(response as AIMessage);

  // ── Step 2: Execute all tool calls requested by the LLM ──────────────────
  const toolCalls = (response as AIMessage).tool_calls ?? [];

  if (toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      log({
        event: 'tool_selected',
        toolName: toolCall.name,
        userId: user.id,
      });

      const matchedTool = tools.find((t) => t.name === toolCall.name);

      if (!matchedTool) {
        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id ?? '',
            content: `Tool "${toolCall.name}" not found.`,
          }),
        );
        continue;
      }

      log({
        event: 'tool_execution_started',
        toolName: toolCall.name,
        arguments: toolCall.args,
        userId: user.id,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolResult = await (matchedTool as any).invoke(toolCall.args);

      log({
        event: 'tool_execution_completed',
        toolName: toolCall.name,
        result: toolResult,
        userId: user.id,
      });

      messages.push(
        new ToolMessage({
          tool_call_id: toolCall.id ?? '',
          content: String(toolResult),
        }),
      );
    }

    // ── Step 3: Synthesis — call the Prettify Tool to format tool results ──────
    const prettifyTool = tools.find((t) => t.name === 'prettify_response');
    
    if (prettifyTool) {
      const toolOutputs = messages
        .filter((m) => m instanceof ToolMessage)
        .map((m) => m.content)
        .join('\n');

      const prettified = await (prettifyTool as any).invoke({
        user_query: message,
        raw_data: toolOutputs,
      });

    log({
      event: 'llm_response_generated',
      userId: user.id,
    });
    return cleanReply(prettified);
  }

  // Fallback: standard synthesis if tool not found (shouldn't happen)
  const llmNoTools = buildModel();
  const finalResponse = await llmNoTools.invoke(messages);
  log({
    event: 'llm_response_generated',
    userId: user.id,
    fallback: true,
  });
  return cleanReply(finalResponse.content);
}

// ── No tool was called — return the direct LLM answer ────────────────────
log({
  event: 'llm_response_generated',
  userId: user.id,
  direct: true,
});
return cleanReply(response.content);
};
