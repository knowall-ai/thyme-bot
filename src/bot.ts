import {
  TeamsActivityHandler,
  TurnContext,
  CardFactory,
  MessageFactory,
  TeamsInfo,
  ConversationReference,
} from "botbuilder";
import { handleHelpCommand } from "./commands/helpCommand";
import { handleSubscribeCommand } from "./commands/subscribeCommand";
import { handleUnsubscribeCommand } from "./commands/unsubscribeCommand";
import { handleStatusCommand } from "./commands/statusCommand";
import { createWelcomeCard } from "./cards/welcomeCard";
import { SubscriptionStore } from "./services/subscriptionStore";

export class ThymeBot extends TeamsActivityHandler {
  private subscriptionStore: SubscriptionStore;

  constructor() {
    super();
    this.subscriptionStore = new SubscriptionStore();

    // Handle incoming messages
    this.onMessage(async (context: TurnContext, next) => {
      await this.handleMessage(context);
      await next();
    });

    // Handle conversation updates (member added/removed)
    this.onMembersAdded(async (context: TurnContext, next) => {
      await this.handleMembersAdded(context);
      await next();
    });

    // Handle conversation updates (for proactive messaging reference)
    this.onConversationUpdate(async (context: TurnContext, next) => {
      await this.handleConversationUpdate(context);
      await next();
    });
  }

  private async handleMessage(context: TurnContext): Promise<void> {
    // Remove the bot mention from the message text
    const text = this.removeMentionText(context).trim().toLowerCase();

    // Handle Adaptive Card actions
    if (context.activity.value) {
      await this.handleCardAction(context);
      return;
    }

    // Parse commands
    if (text.startsWith("help") || text === "?") {
      await handleHelpCommand(context);
    } else if (text.startsWith("subscribe")) {
      await handleSubscribeCommand(context, this.subscriptionStore);
    } else if (text.startsWith("unsubscribe")) {
      await handleUnsubscribeCommand(context, this.subscriptionStore);
    } else if (text.startsWith("status")) {
      await handleStatusCommand(context);
    } else if (text.startsWith("remind me at")) {
      await this.handleCustomReminder(context, text);
    } else {
      // Unknown command - show help
      await context.sendActivity(
        "I didn't understand that command. Type **help** to see available commands."
      );
    }
  }

  private async handleCardAction(context: TurnContext): Promise<void> {
    const action = context.activity.value?.action;

    switch (action) {
      case "subscribe":
        await handleSubscribeCommand(context, this.subscriptionStore);
        break;
      case "unsubscribe":
        await handleUnsubscribeCommand(context, this.subscriptionStore);
        break;
      case "dismiss":
        await context.sendActivity("Great! Your timesheet is all set for today.");
        break;
      default:
        await context.sendActivity("Action received. Thank you!");
    }
  }

  private async handleMembersAdded(context: TurnContext): Promise<void> {
    const membersAdded = context.activity.membersAdded || [];
    const botId = context.activity.recipient?.id;

    for (const member of membersAdded) {
      // Only send welcome card when the bot is added, not when users are added
      if (member.id !== botId) {
        continue;
      }

      // Send welcome card
      const welcomeCard = createWelcomeCard();
      const message = MessageFactory.attachment(CardFactory.adaptiveCard(welcomeCard));
      await context.sendActivity(message);
    }
  }

  private async handleConversationUpdate(context: TurnContext): Promise<void> {
    // Store conversation reference for proactive messaging
    const conversationReference = TurnContext.getConversationReference(context.activity);

    // In a production scenario, you would store this reference
    // to enable proactive messaging later
    if (conversationReference.conversation?.id) {
      // Store for later proactive messaging
      // This is handled by the subscription store when user subscribes
    }
  }

  private async handleCustomReminder(context: TurnContext, text: string): Promise<void> {
    // Parse time from "remind me at HH:MM" format
    const timeMatch = text.match(/remind me at (\d{1,2}):?(\d{2})?\s*(am|pm)?/i);

    if (!timeMatch) {
      await context.sendActivity(
        "I couldn't understand that time format. Try something like: `remind me at 4:30pm` or `remind me at 16:30`"
      );
      return;
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2] || "0", 10);
    const period = timeMatch[3]?.toLowerCase();

    // Convert to 24-hour format
    if (period === "pm" && hours < 12) {
      hours += 12;
    } else if (period === "am" && hours === 12) {
      hours = 0;
    }

    // Validate time
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      await context.sendActivity(
        "That doesn't seem like a valid time. Please use a format like `remind me at 5pm`."
      );
      return;
    }

    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    // Get user info
    let userId: string;
    try {
      const member = await TeamsInfo.getMember(context, context.activity.from.id);
      userId = member.id;
    } catch {
      userId = context.activity.from.id;
    }

    // Update subscription with custom time
    const conversationReference = TurnContext.getConversationReference(context.activity);
    await this.subscriptionStore.updateReminderTime(
      userId,
      formattedTime,
      conversationReference as ConversationReference
    );

    await context.sendActivity(
      `Got it! I'll remind you at **${formattedTime}** each day to fill in your timesheet.`
    );
  }

  private removeMentionText(context: TurnContext): string {
    const activity = context.activity;
    let text = activity.text || "";

    // Remove bot mentions from the message
    if (activity.entities) {
      for (const entity of activity.entities) {
        if (entity.type === "mention") {
          const mention = entity as { mentioned?: { id?: string }; text?: string };
          if (mention.mentioned?.id === activity.recipient?.id && mention.text) {
            text = text.replace(mention.text, "");
          }
        }
      }
    }

    return text;
  }
}
