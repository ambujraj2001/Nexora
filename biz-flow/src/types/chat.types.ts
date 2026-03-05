// Chief of AI – types/chat.types.ts

/** POST /chat request body */
export interface ChatRequestBody {
  message: string;
  accessCode: string;
}

/** POST /chat response */
export interface ChatResponse {
  reply: string;
}
