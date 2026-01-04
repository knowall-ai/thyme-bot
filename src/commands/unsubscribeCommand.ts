import { TurnContext, TeamsInfo, CardFactory, MessageFactory } from "botbuilder";
import { SubscriptionStore } from "../services/subscriptionStore";

const unsubscribeSuccessCard = {
  type: "AdaptiveCard",
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  version: "1.4",
  body: [
    {
      type: "TextBlock",
      text: "You've unsubscribed",
      weight: "Bolder",
      size: "Medium",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: "You won't receive daily reminders anymore.",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: "You can always subscribe again by typing `subscribe`.",
      wrap: true,
      isSubtle: true,
      spacing: "Small",
    },
  ],
  actions: [
    {
      type: "Action.Submit",
      title: "Subscribe Again",
      data: { action: "subscribe" },
    },
  ],
};

const notSubscribedCard = {
  type: "AdaptiveCard",
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  version: "1.4",
  body: [
    {
      type: "TextBlock",
      text: "You're not subscribed",
      weight: "Bolder",
      size: "Medium",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: "You're not currently receiving daily reminders.",
      wrap: true,
    },
  ],
  actions: [
    {
      type: "Action.Submit",
      title: "Subscribe",
      data: { action: "subscribe" },
    },
  ],
};

export async function handleUnsubscribeCommand(
  context: TurnContext,
  subscriptionStore: SubscriptionStore
): Promise<void> {
  try {
    // Get user ID
    let userId: string;

    try {
      const member = await TeamsInfo.getMember(context, context.activity.from.id);
      userId = member.id;
    } catch {
      userId = context.activity.from.id;
    }

    // Check if subscribed
    const existingSubscription = await subscriptionStore.getSubscription(userId);
    if (!existingSubscription?.isActive) {
      const message = MessageFactory.attachment(CardFactory.adaptiveCard(notSubscribedCard));
      await context.sendActivity(message);
      return;
    }

    // Deactivate subscription
    await subscriptionStore.deactivateSubscription(userId);

    const message = MessageFactory.attachment(CardFactory.adaptiveCard(unsubscribeSuccessCard));
    await context.sendActivity(message);
  } catch (error) {
    console.error("Error in unsubscribe command:", error);
    await context.sendActivity("Sorry, I couldn't unsubscribe you. Please try again later.");
  }
}
