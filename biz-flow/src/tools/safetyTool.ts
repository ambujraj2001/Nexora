import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { log } from "../utils/logger";

export const safetyTool = tool(
  async ({ reason }: { reason: string }): Promise<string> => {
    log({
      event: "tool_execution_started",
      toolName: "handle_inappropriate_request",
      args: { reason },
    });

    // Provide a standardized response for safety violations.
    // The prettifier tool (if used) or the agent itself will return this to the user.
    return "I am Chief of AI, a professional assistant. I am programmed to be helpful, safe, and respectful. I cannot fulfill or engage with requests involving hate speech, explicit content, violence, or harmful behavior. If you need help with a professional task or information, please let me know.";
  },
  {
    name: "handle_inappropriate_request",
    description:
      "Call this tool IMMEDIATELY instead of any other tool if the user's request involves hate speech, explicit/pornographic content, harassment, or unsafe behavior.",
    schema: z.object({
      reason: z
        .string()
        .describe(
          'A brief internal note on why the request was blocked (e.g., "explicit_content", "hate_speech").',
        ),
    }),
  },
);
