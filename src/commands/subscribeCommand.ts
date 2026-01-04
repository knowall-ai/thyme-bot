import { TurnContext, TeamsInfo, CardFactory, MessageFactory } from "botbuilder";
import { SubscriptionStore } from "../services/subscriptionStore";

const subscribeSuccessCard = {
  type: "AdaptiveCard",
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  version: "1.4",
  body: [
    {
      type: "TextBlock",
      text: "You're subscribed!",
      weight: "Bolder",
      size: "Medium",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: "I'll remind you at **5pm** each day to fill in your timesheet.",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: "Want a different time? Just say `remind me at [time]`",
      wrap: true,
      isSubtle: true,
      spacing: "Small",
    },
  ],
  actions: [
    {
      type: "Action.Submit",
      title: "Unsubscribe",
      data: { action: "unsubscribe" },
    },
  ],
};

const alreadySubscribedCard = {
  type: "AdaptiveCard",
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  version: "1.4",
  body: [
    {
      type: "TextBlock",
      text: "You're already subscribed!",
      weight: "Bolder",
      size: "Medium",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: "You'll receive daily reminders at your scheduled time.",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: "Want to change your reminder time? Just say `remind me at [time]`",
      wrap: true,
      isSubtle: true,
      spacing: "Small",
    },
  ],
};

export async function handleSubscribeCommand(
  context: TurnContext,
  subscriptionStore: SubscriptionStore
): Promise<void> {
  try {
    // Get user information
    let userPrincipalName = "";
    let userId: string;
    let timezone = "UTC";

    try {
      const member = await TeamsInfo.getMember(context, context.activity.from.id);
      userId = member.id;
      userPrincipalName = member.userPrincipalName || member.email || "";

      // Try to get timezone from user's locale (simplified)
      const locale = context.activity.locale || "en-US";
      timezone = getTimezoneFromLocale(locale);
    } catch {
      userId = context.activity.from.id;
    }

    // Check if already subscribed
    const existingSubscription = await subscriptionStore.getSubscription(userId);
    if (existingSubscription?.isActive) {
      const message = MessageFactory.attachment(CardFactory.adaptiveCard(alreadySubscribedCard));
      await context.sendActivity(message);
      return;
    }

    // Get conversation reference for proactive messaging
    const conversationReference = TurnContext.getConversationReference(context.activity);

    // Create subscription
    await subscriptionStore.createSubscription({
      partitionKey: "subscriptions",
      rowKey: userId,
      userPrincipalName,
      conversationId: conversationReference.conversation?.id || "",
      serviceUrl: conversationReference.serviceUrl || "",
      timezone,
      reminderTime: "17:00",
      isActive: true,
      conversationReference: JSON.stringify(conversationReference),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const message = MessageFactory.attachment(CardFactory.adaptiveCard(subscribeSuccessCard));
    await context.sendActivity(message);
  } catch (error) {
    console.error("Error in subscribe command:", error);
    await context.sendActivity("Sorry, I couldn't subscribe you. Please try again later.");
  }
}

function getTimezoneFromLocale(locale: string): string {
  // Best-effort timezone mapping based on locale.
  // Note: This is a simplified heuristic. Users can customize their reminder time
  // using "remind me at [time]" which will be interpreted in their actual timezone.
  // For precise timezone detection, consider using Microsoft Graph API to get
  // the user's mailbox settings or prompt users to set their timezone explicitly.
  const timezoneMap: Record<string, string> = {
    "en-GB": "Europe/London",
    "en-US": "America/Chicago", // Central time as middle-ground for US
    "en-AU": "Australia/Sydney",
    "en-CA": "America/Toronto",
    "de-DE": "Europe/Berlin",
    "fr-FR": "Europe/Paris",
    "es-ES": "Europe/Madrid",
    "ja-JP": "Asia/Tokyo",
    "zh-CN": "Asia/Shanghai",
    "pt-BR": "America/Sao_Paulo",
    "en-IN": "Asia/Kolkata",
  };

  return timezoneMap[locale] || "UTC";
}
