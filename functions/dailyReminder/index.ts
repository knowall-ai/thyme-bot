import { AzureFunction, Context } from "@azure/functions";
import { ReminderService } from "../../src/services/reminderService";

// Initialize ReminderService at module level to optimize cold starts
// and reuse connections across function invocations
const reminderService = new ReminderService();

/**
 * Azure Function timer trigger for daily reminders
 *
 * This function runs every hour and checks which users should receive
 * reminders based on their timezone and configured reminder time.
 *
 * Schedule: "0 0 * * * *" - runs at the top of every hour
 *
 * For each user:
 * 1. Get their timezone and configured reminder time (default 17:00)
 * 2. Check if their local time matches the reminder time
 * 3. If yes, send them a proactive reminder message
 */
const timerTrigger: AzureFunction = async (context: Context): Promise<void> => {
  const timestamp = new Date().toISOString();
  context.log(`Daily reminder function started at ${timestamp}`);

  try {
    const results = await reminderService.sendDailyReminders();

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    context.log(`Reminder results: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      const failedUsers = results
        .filter((r) => !r.success)
        .map((r) => `${r.userId}: ${r.error}`)
        .join("; ");
      context.log.warn(`Failed reminders: ${failedUsers}`);
    }
  } catch (error) {
    context.log.error("Error in daily reminder function:", error);
    throw error;
  }

  context.log(`Daily reminder function completed at ${new Date().toISOString()}`);
};

export default timerTrigger;
