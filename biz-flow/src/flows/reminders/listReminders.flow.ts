import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";

export class ListRemindersFlow implements IFlow {
  id = "list_reminders";
  version = 1;
  priority = 100;

  /**
   * Stage 1 & 2 matching: Regex + Keywords
   */
  match(message: string): boolean {
    const patterns = [
      /show.*reminder/i,
      /list.*reminder/i,
      /what.*reminder/i,
      /reminder.*have/i,
      /check.*reminder/i,
      /^reminders$/i
    ];

    return patterns.some(regex => regex.test(message));
  }

  /**
   * Execution logic for listing reminders
   */
  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    // 1. Emit thinking event
    context.logger.event("thinking", "Checking your reminders...", "pending");

    try {
      // 2. Call reminder service
      context.logger.event("tool_start" as any, "Fetching reminders from database", "pending");
      const reminders = await context.services.reminders.getUserReminders(context.userId);

      // 3. Format response
      let reply: string;
      if (!reminders || reminders.length === 0) {
        reply = "You don't have any reminders yet.";
      } else {
        // Return a UI component for the frontend to render a premium card
        const uiComponent = {
          type: "ui_component",
          component: "reminder_list",
          data: reminders.map((r: any) => ({
            title: r.title,
            reminder_at:
              r.remind_at_timestamp !== undefined
                ? new Date(r.remind_at_timestamp).toISOString()
                : r.remind_at,
            status: r.status || 'pending'
          }))
        };
        reply = JSON.stringify(uiComponent);
      }

      // 4. Send final reply through SSE and return success
      context.sse.sendFinal(reply);

      return {
        type: "success",
        reply
      };
    } catch (error: any) {
      context.logger.error("Failed to list reminders", error);
      // Let the engine handle the fallback
      throw error;
    }
  }
}

export const listRemindersFlow = new ListRemindersFlow();
