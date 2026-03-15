import { IFlow, FlowContext, FlowResult } from "../types";

export class ListJournalFlow implements IFlow {
  id = "list_journal";
  version = 1;
  priority = 105;

  match(message: string): boolean {
    return /(?:list|show|what).*(journal|journal entries)/i.test(message);
  }

  async execute(context: FlowContext): Promise<FlowResult> {
    context.logger.event("thinking", "Fetching journal entries...", "pending");

    try {
      const journal = await context.services.entries.getUserJournal(context.userId);
      if (!journal || journal.length === 0) {
        const reply = "You don't have any journal entries yet.";
        context.sse.sendFinal(reply);
        return { type: "success", reply };
      }

      const reply = journal
        .map(
          (entry: any, idx: number) =>
            `${idx + 1}. ${entry.title || 'Journal entry'} — ${entry.created_at_timestamp ? new Date(entry.created_at_timestamp).toLocaleDateString() : 'Unknown date'}`,
        )
        .join("\n");

      context.sse.sendFinal(reply);
      return { type: "success", reply };
    } catch (error: any) {
      context.logger.error("Failed to list journal entries", error);
      return { type: "fallback" };
    }
  }
}

export const listJournalFlow = new ListJournalFlow();
