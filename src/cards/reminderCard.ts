export interface ReminderCardData {
  hoursToday: number;
  userName?: string;
}

export function createReminderCard(data: ReminderCardData) {
  const hoursText =
    data.hoursToday > 0
      ? `You've logged **${data.hoursToday.toFixed(1)}** hours today.`
      : "You haven't logged any hours today yet.";

  const greeting = data.userName ? `Hey ${data.userName}!` : "Hey there!";

  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "Time to log your hours!",
        weight: "Bolder",
        size: "Large",
        wrap: true,
      },
      {
        type: "TextBlock",
        text: greeting,
        wrap: true,
        spacing: "Small",
      },
      {
        type: "TextBlock",
        text: hoursText,
        wrap: true,
        spacing: "Small",
      },
      {
        type: "TextBlock",
        text: "Don't forget to update your timesheet before you head off.",
        wrap: true,
        isSubtle: true,
        spacing: "Small",
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "Open Timesheet",
        url: "https://thyme.knowall.ai/timesheet",
        style: "positive",
      },
      {
        type: "Action.Submit",
        title: "Already Done",
        data: { action: "dismiss" },
      },
    ],
  };
}
