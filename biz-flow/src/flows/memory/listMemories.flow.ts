import { IFlow, FlowContext, FlowResult } from "../types";

export class ListMemoriesFlow implements IFlow {
  id = "list_memories";
  version = 1;
  priority = 115;

  match(message: string): boolean {
    return /(?:list|show|what).*(memory|memories)/i.test(message);
  }

  async execute(context: FlowContext): Promise<FlowResult> {
    context.logger.event("thinking", "Fetching memories...", "pending");

    try {
      const memories = await context.services.entries.getUserMemories(context.userId);
      if (!memories || memories.length === 0) {
        const reply = "You don't have any saved memories yet.";
        context.sse.sendFinal(reply);
        return { type: "success", reply };
      }

      const uiComponent = {
        type: "ui_component",
        component: "memory_list",
        data: memories.map((m: any) => ({
          title: m.title || "Untitled Memory",
          excerpt: m.content,
          created_at: m.created_at_timestamp,
        })),
      };

      const reply = JSON.stringify(uiComponent);
      context.sse.sendFinal(reply);
      return { type: "success", reply };
    } catch (error: any) {
      context.logger.error("Failed to list memories", error);
      return { type: "fallback" };
    }
  }
}

export const listMemoriesFlow = new ListMemoriesFlow();
