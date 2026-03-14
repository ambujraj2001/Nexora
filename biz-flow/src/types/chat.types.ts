// Nexora – types/chat.types.ts

/** POST /chat request body */
export interface ChatRequestBody {
  message: string;
  accessCode: string;
  conversationId?: string;
  incognito?: boolean;
}

/** POST /chat response */
export interface ChatResponse {
  reply: string;
}

/** GET /chat/history response */
export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  created_at: string;
  conversation_id?: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}
