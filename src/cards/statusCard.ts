export interface StatusCardData {
  hoursToday: number;
  hoursThisWeek: number;
}

export function createStatusCard(hoursToday: number, hoursThisWeek: number) {
  const todayStatus = hoursToday > 0 ? `${hoursToday.toFixed(1)} hours` : "No hours logged";
  const weekStatus = hoursThisWeek > 0 ? `${hoursThisWeek.toFixed(1)} hours` : "No hours logged";

  // Calculate progress toward 40 hour week
  const weekProgress = Math.min(100, (hoursThisWeek / 40) * 100);
  const dayOfWeek = new Date().getDay();
  const workDaysPassed = Math.min(dayOfWeek, 5); // Mon-Fri only
  const expectedHours = workDaysPassed * 8;
  const isOnTrack = hoursThisWeek >= expectedHours * 0.9;

  const statusEmoji = isOnTrack ? "Great progress!" : "You might be behind";
  const statusColor = isOnTrack ? "good" : "warning";

  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "Your Timesheet Status",
        weight: "Bolder",
        size: "Large",
        wrap: true,
      },
      {
        type: "ColumnSet",
        spacing: "Medium",
        columns: [
          {
            type: "Column",
            width: "stretch",
            items: [
              {
                type: "TextBlock",
                text: "Today",
                weight: "Bolder",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: todayStatus,
                size: "ExtraLarge",
                wrap: true,
              },
            ],
          },
          {
            type: "Column",
            width: "stretch",
            items: [
              {
                type: "TextBlock",
                text: "This Week",
                weight: "Bolder",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: weekStatus,
                size: "ExtraLarge",
                wrap: true,
              },
            ],
          },
        ],
      },
      {
        type: "TextBlock",
        text: `Week progress: ${weekProgress.toFixed(0)}% of 40 hours`,
        wrap: true,
        spacing: "Medium",
      },
      {
        type: "TextBlock",
        text: statusEmoji,
        wrap: true,
        color: statusColor,
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
        type: "Action.OpenUrl",
        title: "View Reports",
        url: "https://thyme.knowall.ai/reports",
      },
    ],
  };
}
