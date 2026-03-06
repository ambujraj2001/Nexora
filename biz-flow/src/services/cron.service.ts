import cron from "node-cron";
import { getDueReminders, updateReminder } from "./reminder.service";
import { sendReminderEmail } from "./mail.service";

export const initCronJobs = () => {
  console.log("Initializing cron jobs...");

  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const dueReminders = await getDueReminders();

      if (dueReminders.length === 0) return;

      console.log(`Processing ${dueReminders.length} due reminders...`);

      for (const reminder of dueReminders) {
        const userEmail = reminder.users?.email;
        const userName = reminder.users?.full_name || "User";

        if (userEmail) {
          try {
            await sendReminderEmail(
              userEmail,
              reminder.title,
              reminder.remind_at,
            );
            console.log(
              `Reminder email sent to ${userEmail} for "${reminder.title}"`,
            );

            // Mark reminder as 'notified' or 'completed' so we don't send it again
            await updateReminder(reminder.id, reminder.user_id, {
              status: "notified",
            });
          } catch (mailError) {
            console.error(`Failed to send email to ${userEmail}:`, mailError);
          }
        } else {
          console.warn(
            `No email found for user associated with reminder ${reminder.id}`,
          );
          // Still mark as notified to avoid infinite loops if email is missing
          await updateReminder(reminder.id, reminder.user_id, {
            status: "failed_no_email",
          });
        }
      }
    } catch (err) {
      console.error("Error in reminder cron job:", err);
    }
  });
};
