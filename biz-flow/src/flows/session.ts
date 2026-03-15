import { redis } from "../config/redis";
import { FlowSession } from "./types";

const SESSION_PREFIX = "flow:session:";
const SESSION_TTL = 300; // 5 minutes

const buildSessionKey = (userId: string, conversationId?: string): string => {
  const scopedConversationId = conversationId?.trim() || "__default__";
  return `${SESSION_PREFIX}${userId}:${scopedConversationId}`;
};

export class FlowSessionManager {
  /**
   * Retrieves an active flow session for a user
   */
  async getSession(
    userId: string,
    conversationId?: string,
  ): Promise<FlowSession | null> {
    try {
      const session = await redis.get<FlowSession>(
        buildSessionKey(userId, conversationId),
      );
      if (!session) return null;

      // Double check expiry (though redis handles this)
      if (Date.now() > session.expiresAt) {
        await this.clearSession(userId, conversationId);
        return null;
      }

      return session;
    } catch (error) {
      console.error("[FlowSessionManager] Error getting session:", error);
      return null;
    }
  }

  /**
   * Sets or updates a flow session for a user
   */
  async setSession(
    userId: string,
    session: Omit<FlowSession, "expiresAt">,
    conversationId?: string,
  ): Promise<void> {
    try {
      const fullSession: FlowSession = {
        ...session,
        expiresAt: Date.now() + SESSION_TTL * 1000,
      };

      await redis.set(buildSessionKey(userId, conversationId), fullSession, {
        ex: SESSION_TTL,
      });
    } catch (error) {
      console.error("[FlowSessionManager] Error setting session:", error);
    }
  }

  /**
   * Removes a flow session
   */
  async clearSession(userId: string, conversationId?: string): Promise<void> {
    try {
      await redis.del(buildSessionKey(userId, conversationId));
    } catch (error) {
      console.error("[FlowSessionManager] Error clearing session:", error);
    }
  }
}

export const sessionManager = new FlowSessionManager();
