import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";

export class ListTasksFlow implements IFlow {
  id = "list_tasks";
  version = 1;
  priority = 100;

  match(message: string): boolean {
    const patterns = [
      /show.*task/i,
      /list.*task/i,
      /what.*task/i,
      /^tasks$/i
    ];
    return patterns.some(regex => regex.test(message));
  }

  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    context.logger.event("thinking", "Fetching your tasks...", "pending");

    try {
      context.logger.event("tool_start" as any, "Retrieving tasks from database", "pending");
      const tasks = await context.services.tasks.getUserTasks(context.userId);

      let reply: string;
      if (!tasks || tasks.length === 0) {
        reply = "You don't have any tasks yet.";
      } else {
        const uiComponent = {
          type: "ui_component",
          component: "task_list",
          data: tasks.map((t: any) => ({
            title: t.title,
            is_completed: t.status === 'completed',
            status: t.status
          }))
        };
        reply = JSON.stringify(uiComponent);
      }

      context.sse.sendFinal(reply);
      return { type: "success", reply };
    } catch (error: any) {
      context.logger.error("Failed to list tasks", error);
      return { type: "fallback" };
    }
  }
}

export const listTasksFlow = new ListTasksFlow();
