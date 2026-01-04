import { TurnContext, CardFactory, MessageFactory } from "botbuilder";

const helpCard = {
  type: "AdaptiveCard",
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  version: "1.4",
  body: [
    {
      type: "TextBlock",
      text: "Thyme Bot Commands",
      weight: "Bolder",
      size: "Large",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: "Here's what I can do for you:",
      wrap: true,
      spacing: "Small",
    },
    {
      type: "Container",
      spacing: "Medium",
      items: [
        {
          type: "FactSet",
          facts: [
            {
              title: "help",
              value: "Show this help message",
            },
            {
              title: "subscribe",
              value: "Get daily reminders at 5pm",
            },
            {
              title: "unsubscribe",
              value: "Stop receiving reminders",
            },
            {
              title: "status",
              value: "Show today's logged hours",
            },
            {
              title: "remind me at [time]",
              value: "Set a custom reminder time",
            },
          ],
        },
      ],
    },
    {
      type: "TextBlock",
      text: "Use the tabs above to access your Timesheet, Timer, and Reports.",
      wrap: true,
      spacing: "Medium",
      isSubtle: true,
    },
  ],
  actions: [
    {
      type: "Action.OpenUrl",
      title: "Open Timesheet",
      url: "https://thyme.knowall.ai/timesheet",
    },
  ],
};

export async function handleHelpCommand(context: TurnContext): Promise<void> {
  const message = MessageFactory.attachment(CardFactory.adaptiveCard(helpCard));
  await context.sendActivity(message);
}
