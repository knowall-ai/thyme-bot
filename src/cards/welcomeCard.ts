export interface WelcomeCardData {
  userName?: string;
}

export function createWelcomeCard(data?: WelcomeCardData) {
  const greeting = data?.userName ? `Welcome, ${data.userName}!` : "Welcome to Thyme!";

  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: greeting,
        weight: "Bolder",
        size: "Large",
        wrap: true,
      },
      {
        type: "TextBlock",
        text: "I'll help you stay on top of your timesheets with friendly daily reminders.",
        wrap: true,
        spacing: "Small",
      },
      {
        type: "FactSet",
        spacing: "Medium",
        facts: [
          {
            title: "Daily reminder at 5pm",
            value: "",
          },
          {
            title: "Quick status checks",
            value: "",
          },
          {
            title: "Direct link to your timesheet",
            value: "",
          },
        ],
      },
      {
        type: "TextBlock",
        text: "Use the tabs above to access your Timesheet, Timer, and Reports directly.",
        wrap: true,
        spacing: "Medium",
        isSubtle: true,
      },
    ],
    actions: [
      {
        type: "Action.Submit",
        title: "Subscribe to Reminders",
        style: "positive",
        data: { action: "subscribe" },
      },
      {
        type: "Action.OpenUrl",
        title: "Open Timesheet",
        url: "https://thyme.knowall.ai/timesheet",
      },
    ],
  };
}
