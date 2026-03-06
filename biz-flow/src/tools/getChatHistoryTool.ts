import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { log } from "../utils/logger";
import { findUserByAccessCode } from "../services/user.service";
import { getUserChatHistory } from "../services/chat.service";

const getChatHistorySchema = z.object({
  accessCode: z
    .string()
    .describe("The user's access code to fetch chat history for."),
});

export const getChatHistoryTool = tool(
  async ({ accessCode }: { accessCode: string }): Promise<string> => {
    log({
      event: "tool_execution_started",
      toolName: "get_chat_history",
      args: { accessCode },
    });

    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) {
        return "Error: Invalid access code.";
      }

      const messages = await getUserChatHistory(user.id);

      if (messages.length === 0) {
        return "No chat history found for this user.";
      }

      const formattedHistory = messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      return formattedHistory;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "get_chat_history",
        error: error.message,
      });
      return `Error fetching chat history: ${error.message}`;
    }
  },
  {
    name: "get_chat_history",
    description:
      "Fetches the complete chat history for a user using their access code. Use this when the user asks to see previous messages or refers to past conversations.",
    schema: getChatHistorySchema,
  },
);
