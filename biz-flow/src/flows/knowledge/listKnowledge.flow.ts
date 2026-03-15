import { IFlow, FlowContext, FlowResult } from "../types";

export class ListKnowledgeFlow implements IFlow {
  id = "list_knowledge";
  version = 1;
  priority = 105;

  match(message: string): boolean {
    return /(?:list|show|what).*(knowledge|notes)/i.test(message);
  }

  async execute(context: FlowContext): Promise<FlowResult> {
    context.logger.event("thinking", "Fetching knowledge entries...", "pending");

    try {
      const knowledge = await context.services.entries.getUserKnowledge(context.userId);
      if (!knowledge || knowledge.length === 0) {
        const reply = "You don't have any knowledge saved yet.";
        context.sse.sendFinal(reply);
        return { type: "success", reply };
      }

      const reply = knowledge
        .map(
          (entry: any, idx: number) =>
            `${idx + 1}. ${entry.title || 'Knowledge item'} — ${entry.created_at_timestamp ? new Date(entry.created_at_timestamp).toLocaleDateString() : 'Unknown date'}`,
        )
        .join("\n");

      context.sse.sendFinal(reply);
      return { type: "success", reply };
    } catch (error: any) {
      context.logger.error("Failed to list knowledge entries", error);
      return { type: "fallback" };
    }
  }
}

export const listKnowledgeFlow = new ListKnowledgeFlow();
