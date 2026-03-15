import { supabase } from "../config/supabase";

export interface ChatMessage {
  id: string;
  user_id: string;
  conversation_id?: string;
  role: "user" | "ai";
  content: string;
  created_at?: string;
  created_at_timestamp?: number;
}

/**
 * Fetches all chat messages for a specific user.
 */
export const getUserChatHistory = async (
  userId: string,
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at_timestamp", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as ChatMessage[];
};

/**
 * Deletes all chat messages for a specific user.
 */
export const deleteUserChatHistory = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Saves a new chat message to the database.
 */
export const saveChatMessage = async (
  userId: string,
  role: "user" | "ai",
  content: string,
  conversationId?: string,
): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      user_id: userId,
      role,
      content,
      conversation_id: conversationId,
      created_at_timestamp: Date.now(),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ChatMessage;
};
/**
 * Fetches the most recent messages for a specific conversation to provide context.
 */
export const getRecentConversationHistory = async (
  userId: string,
  conversationId: string,
  limit: number = 15,
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .order("created_at_timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  // Reverse to maintain chronological order
  return (data as ChatMessage[]).reverse();
};
