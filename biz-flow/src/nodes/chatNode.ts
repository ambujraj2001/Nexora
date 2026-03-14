import { GraphState } from "../graphs/state";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { buildModel } from "../config/model";
import { debugGraphState } from "../utils/debugGraphState";
import { log } from "../utils/logger";

export const chatNode = async (state: GraphState) => {
  debugGraphState("chatNode_start", state);

  const llm = buildModel([]);

  // For general chat, we want to focus on the latest message but keep relative context.
  // We'll filter the messages to only include the last few turns to avoid the "Lost in Middle"
  // problem and prevent the model from obsessing over earlier topics.
  const lastMessages = state.messages.slice(-20);

  // We provide a specific, lean system prompt for general conversation.
  const chatPrompt = new SystemMessage(
    `You are Nexora, a helpful personal assistant.
    
    CRITICAL RULES:
    1. Focus ONLY on the user's LATEST request.
    2. Do NOT repeat information from previous turns unless it's directly relevant to the current question.
    3. If the user changes the topic, follow the new topic immediately.
    4. Your output MUST be a valid JSON object matching the required format.
    
    RESPONSE FORMAT:
    {
      "type": "final",
      "message": "your helpful response here"
    }
    OR
    {
      "type": "clarification",
      "question": "question text",
      "options": ["option 1", "option 2"]
    }
    
    Do NOT include markdown markers or extra text.`.trim(),
  );

  const response = await llm.invoke([chatPrompt, ...lastMessages]);

  log({
    event: "chat_node_completed",
    userId: state.userId,
    content: response.content,
  });

  debugGraphState("chatNode_end", state);

  return {
    messages: [response],
  };
};
