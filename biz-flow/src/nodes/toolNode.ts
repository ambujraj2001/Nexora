import { GraphState } from "../graphs/state";
import { tools } from "../tools";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { log } from "../utils/logger";

export const toolNode = async (state: GraphState) => {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return { messages: [] };
  }

  const toolMessages: ToolMessage[] = [];
  const results: any[] = [];

  for (const toolCall of lastMessage.tool_calls) {
    const matchedTool = tools.find((t) => t.name === toolCall.name);

    if (!matchedTool) {
      toolMessages.push(
        new ToolMessage({
          tool_call_id: toolCall.id ?? "",
          name: toolCall.name,
          content: `Tool "${toolCall.name}" not found.`,
        }),
      );
      continue;
    }

    log({
      event: "tool_execution_started",
      toolName: toolCall.name,
      arguments: toolCall.args,
      userId: state.userId,
    });

    try {
      // @ts-ignore - invoking dynamic tool
      const toolResult = await matchedTool.invoke(toolCall.args);

      log({
        event: "tool_execution_completed",
        toolName: toolCall.name,
        result: toolResult,
        userId: state.userId,
      });

      results.push(toolResult);
      toolMessages.push(
        new ToolMessage({
          tool_call_id: toolCall.id ?? "",
          name: toolCall.name,
          content:
            typeof toolResult === "string"
              ? toolResult
              : JSON.stringify(toolResult),
        }),
      );
    } catch (error: any) {
      const errMsg = error instanceof Error ? error.message : String(error);
      log({
        event: "tool_execution_failed",
        toolName: toolCall.name,
        error: errMsg,
        userId: state.userId,
      });

      toolMessages.push(
        new ToolMessage({
          tool_call_id: toolCall.id ?? "",
          name: toolCall.name,
          content: `Error executing ${toolCall.name}: ${errMsg}`,
        }),
      );
    }
  }

  return {
    messages: toolMessages,
    toolResults: results,
  };
};

export const shouldContinue = (state: GraphState) => {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return "respond";
};
