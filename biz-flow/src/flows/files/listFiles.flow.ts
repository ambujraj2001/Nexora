import { IFlow, FlowContext, FlowResult } from "../types";

export class ListFilesFlow implements IFlow {
  id = "list_files";
  version = 1;
  priority = 105;

  match(message: string): boolean {
    return /(?:list|show|what).*(file|files|document|documents)/i.test(message);
  }

  async execute(context: FlowContext): Promise<FlowResult> {
    context.logger.event("thinking", "Fetching files...", "pending");

    try {
      const files = await context.services.files.getUserFiles(context.userId);
      if (!files || files.length === 0) {
        const reply = "You don't have any uploaded files yet.";
        context.sse.sendFinal(reply);
        return { type: "success", reply };
      }

      const reply = files
        .map(
          (file: any, idx: number) =>
            `${idx + 1}. ${file.file_name} — uploaded ${file.created_at_timestamp ? new Date(file.created_at_timestamp).toLocaleDateString() : 'Unknown date'}`,
        )
        .join("\n");

      context.sse.sendFinal(reply);
      return { type: "success", reply };
    } catch (error: any) {
      context.logger.error("Failed to list files", error);
      return { type: "fallback" };
    }
  }
}

export const listFilesFlow = new ListFilesFlow();
