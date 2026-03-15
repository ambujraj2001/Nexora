import { FlowMatch } from "./types";
import { registry } from "./registry";

export class FlowRouter {
  /**
   * Orchestrates the 3-stage routing system
   */
  async match(message: string): Promise<FlowMatch | null> {
    const originalMessage = message.trim();
    const cleanMessage = originalMessage.toLowerCase();

    // Stage 1 & 2: Deterministic and Heuristic Matching
    // We iterate through all flows and let them determine if they match.
    // The match() method in each flow should handle regex and keyword heuristics.
    const flows = registry.getAllFlows();

    for (const flow of flows) {
      if (flow.match(cleanMessage)) {
        return {
          flowId: flow.id,
          parameters: this.extractParameters(flow.id, originalMessage, cleanMessage),
          confidence: 1.0, // Stage 1/2 matches are considered high confidence
        };
      }
    }

    // Stage 3: LLM Classification Fallback (Placeholder)
    // TODO: Implement LLM-based intent detection here if Stage 1 & 2 fail.
    
    return null;
  }

  /**
   * Helper to extract parameters from common patterns (Placeholder)
   * Real implementation will likely be more robust or flow-specific.
   */
  private extractParameters(
    flowId: string,
    originalMessage: string,
    normalizedMessage: string,
  ): Record<string, any> {
    void flowId;
    return {
      originalMessage,
      normalizedMessage,
    };
  }
}

export const router = new FlowRouter();
