import { buildModel } from "../config/model";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getUserReminders } from "./reminder.service";
import { getUserTasks } from "./task.service";

export interface InsightEntry {
  title: string;
  description: string;
  type: "neutral" | "positive" | "negative" | "recommendation";
}

export const generateInsights = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<InsightEntry[]> => {
  const tasks = await getUserTasks(userId);
  const reminders = await getUserReminders(userId);

  const llm = buildModel();

  const prompt = `You are an executive assistant analyzing the user's schedule. 
You must address the user directly using "You" and "Your" (e.g., "Your Tuesday afternoon is heavily booked", "You have two high priority tasks pending"). NEVER refer to them as "the user" or in the third person.

User Tasks (Action Items): ${JSON.stringify(tasks.filter((t) => t.status !== "completed"))}
User Active Reminders (Time-bound events): ${JSON.stringify(reminders.filter((r) => r.status === "active"))}
Selected Date: ${startDate || "N/A"} (Focus primarily on this day's immediate agenda)

Note: Uncompleted tasks do not have specific times and should be assumed to take place in a generic afternoon Deep Work block (e.g. 2 PM - 5 PM).

Generate 2-3 actionable insights directly advising the user on today's schedule and their pending tasks. 
For example: identifying busy blocks, suggesting optimal meeting times based on gaps, or recommending focus time.
Return a RAW JSON array of objects with the exact schema: [{"title": "string", "description": "string", "type": "neutral" | "positive" | "negative" | "recommendation"}]. Do not include markdown formatting like \`\`\`json. Return ONLY valid JSON block.`;

  try {
    const response = await llm.invoke([
      new SystemMessage(
        "You are an expert AI productivity assistant. Output strictly valid JSON arrays as requested.",
      ),
      new HumanMessage(prompt),
    ]);

    let content = response.content as string;

    content = content.trim();
    if (content.startsWith("```json")) {
      content = content
        .replace(/^```json/, "")
        .replace(/```$/, "")
        .trim();
    } else if (content.startsWith("```")) {
      content = content.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const insights = JSON.parse(content);
    return insights;
  } catch (error) {
    console.error("Failed to generate insights:", error);
    return [
      {
        title: "Schedule Overview Unavailable",
        description:
          "I couldn't generate insights for this timeframe right now.",
        type: "neutral",
      },
    ];
  }
};
