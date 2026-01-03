import {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  ConfigurationBotFrameworkAuthenticationOptions,
  TurnContext,
  ConversationReference,
  CardFactory,
  MessageFactory,
} from "botbuilder";
import { DateTime } from "luxon";
import { SubscriptionStore, Subscription } from "./subscriptionStore";
import { ThymeApiClient } from "./thymeApiClient";
import { createReminderCard } from "../cards/reminderCard";
import { config } from "../config";

export interface ReminderResult {
  userId: string;
  success: boolean;
  error?: string;
}

export class ReminderService {
  private adapter: CloudAdapter;
  private subscriptionStore: SubscriptionStore;
  private thymeClient: ThymeApiClient;

  constructor() {
    const botFrameworkAuth = new ConfigurationBotFrameworkAuthentication(
      {} as ConfigurationBotFrameworkAuthenticationOptions,
      {
        MicrosoftAppId: config.botId,
        MicrosoftAppPassword: config.botPassword,
        MicrosoftAppType: "MultiTenant",
      }
    );

    this.adapter = new CloudAdapter(botFrameworkAuth);
    this.subscriptionStore = new SubscriptionStore();
    this.thymeClient = new ThymeApiClient();
  }

  /**
   * Get all subscriptions whose local time matches the target hour
   */
  async getSubscriptionsForCurrentHour(): Promise<Subscription[]> {
    const allSubscriptions = await this.subscriptionStore.getAllActiveSubscriptions();
    const matchingSubscriptions: Subscription[] = [];

    for (const subscription of allSubscriptions) {
      const userTime = DateTime.now().setZone(subscription.timezone);
      const [targetHour, targetMinute] = subscription.reminderTime.split(":").map(Number);

      // Check if user's current time is within the target hour
      if (userTime.hour === targetHour && userTime.minute >= targetMinute && userTime.minute < targetMinute + 60) {
        matchingSubscriptions.push(subscription);
      }
    }

    return matchingSubscriptions;
  }

  /**
   * Send reminder to a single user
   */
  async sendReminder(subscription: Subscription): Promise<ReminderResult> {
    try {
      const conversationReference: ConversationReference = JSON.parse(
        subscription.conversationReference
      );

      // Get user's hours from Thyme API
      let hoursToday = 0;
      try {
        const status = await this.thymeClient.getUserStatus(subscription.userPrincipalName);
        hoursToday = status.hoursToday;
      } catch {
        // Continue even if we can't get hours
      }

      // Create the reminder card
      const reminderCard = createReminderCard({
        hoursToday,
        userName: subscription.userPrincipalName.split("@")[0],
      });

      // Send proactive message
      await this.adapter.continueConversationAsync(
        config.botId,
        conversationReference,
        async (context: TurnContext) => {
          const message = MessageFactory.attachment(CardFactory.adaptiveCard(reminderCard));
          await context.sendActivity(message);
        }
      );

      return { userId: subscription.rowKey, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error sending reminder to ${subscription.rowKey}:`, error);
      return { userId: subscription.rowKey, success: false, error: errorMessage };
    }
  }

  /**
   * Send reminders to all eligible users
   */
  async sendDailyReminders(): Promise<ReminderResult[]> {
    const subscriptions = await this.getSubscriptionsForCurrentHour();
    const results: ReminderResult[] = [];

    console.log(`Sending reminders to ${subscriptions.length} users`);

    for (const subscription of subscriptions) {
      const result = await this.sendReminder(subscription);
      results.push(result);

      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`Reminder results: ${successful} successful, ${failed} failed`);

    return results;
  }

  /**
   * Check if it's time to send reminders (for a specific timezone at 5pm)
   */
  isReminderTime(timezone: string, targetHour: number = 17): boolean {
    const userTime = DateTime.now().setZone(timezone);
    return userTime.hour === targetHour;
  }
}
