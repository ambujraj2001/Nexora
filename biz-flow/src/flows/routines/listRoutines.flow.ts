import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";

export class ListRoutinesFlow implements IFlow {
  id = "list_routines";
  version = 1;
  priority = 100;

  match(message: string): boolean {
    const patterns = [
      /show.*routine/i,
      /list.*routine/i,
      /what.*routine/i,
      /^routines$/i
    ];
    return patterns.some(regex => regex.test(message));
  }

  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    context.logger.event("thinking", "Fetching your AI routines...", "pending");

    try {
      context.logger.event("tool_start" as any, "Retrieving routines from database", "pending");
      const routines = await context.services.routines.getUserRoutines(context.userId);

      let reply: string;
      if (!routines || routines.length === 0) {
        reply = "You don't have any AI routines scheduled yet.";
      } else {
        const uiComponent = {
          type: "ui_component",
          component: "routine_list",
          data: routines.map((r: any) => ({
            name: r.name,
            instruction: r.instruction,
            cron_expression: r.cron_expression,
            is_active: r.is_active,
            last_run: r.last_run
          }))
        };
        reply = JSON.stringify(uiComponent);
      }

      context.sse.sendFinal(reply);
      return { type: "success", reply };
    } catch (error: any) {
      context.logger.error("Failed to list routines", error);
      return { type: "fallback" };
    }
  }
}

export const listRoutinesFlow = new ListRoutinesFlow();
