import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";
import { sessionManager } from "../session";

export class DeleteRoutineFlow implements IFlow {
  id = "delete_routine";
  version = 1;
  priority = 110;

  match(message: string): boolean {
    const patterns = [
      /delete.*routine/i,
      /remove.*routine/i,
      /stop.*routine/i,
      /cancel.*routine/i
    ];
    return patterns.some((regex) => regex.test(message));
  }

  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    const userId = context.userId;
    const message = context.parameters.originalMessage || "";

    if (session && session.step === "await_selection") {
      return this.handleSelection(context, session, message);
    }

    context.logger.event("thinking", "Fetching your AI routines...", "pending");
    
    try {
      const routines = await context.services.routines.getUserRoutines(userId);

      if (!routines || routines.length === 0) {
        const reply = "You don't have any routines to delete.";
        context.sse.sendFinal(reply);
        return { type: "success", reply };
      }

      const listString = routines
        .map((r: any, i: number) => `${i + 1}. ${r.name} (${r.cron_expression})`)
        .join("\n");

      const prompt = `Which AI routine would you like to delete?\n\n${listString}\n\nReply with the **number** or the **name**.`;
      
      await sessionManager.setSession(userId, {
        flowId: this.id,
        flowVersion: this.version,
        step: "await_selection",
        context: { routines }
      });

      context.sse.sendFinal(prompt);

      return {
        type: "success",
        reply: prompt
      };
    } catch (error: any) {
      context.logger.error("Failed to start delete_routine flow", error);
      return { type: "fallback" };
    }
  }

  private async handleSelection(context: FlowContext, session: FlowSession, message: string): Promise<FlowResult> {
    const routines = session.context.routines as any[];
    const input = message.trim().toLowerCase();
    
    const index = parseInt(input) - 1;
    let selectedRoutine = (!isNaN(index) && index >= 0 && index < routines.length) ? routines[index] : null;

    if (!selectedRoutine) {
      selectedRoutine = routines.find(r => r.name.toLowerCase().includes(input)) || null;
    }

    if (!selectedRoutine) {
      const retryPrompt = "I couldn't identify which routine you want to delete. Please reply with the **number** or the exact **name**.";
      context.sse.sendFinal(retryPrompt);
      return { type: "success", reply: retryPrompt };
    }

    try {
      context.logger.event("tool_start" as any, `Deleting routine: "${selectedRoutine.name}"`, "pending");
      
      await context.services.routines.deleteRoutine(selectedRoutine.id);
      
      const confirmation = `AI routine deleted: **${selectedRoutine.name}**.`;
      context.sse.sendFinal(confirmation);

      await sessionManager.clearSession(context.userId);

      return {
        type: "success",
        reply: confirmation
      };
    } catch (error: any) {
      context.logger.error("Failed to execute routine deletion in flow", error);
      await sessionManager.clearSession(context.userId);
      return { type: "fallback" };
    }
  }
}

export const deleteRoutineFlow = new DeleteRoutineFlow();
