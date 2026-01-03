import { createWelcomeCard } from "../src/cards/welcomeCard";
import { createReminderCard } from "../src/cards/reminderCard";
import { createStatusCard } from "../src/cards/statusCard";

describe("Adaptive Cards", () => {
  describe("Welcome Card", () => {
    it("should create a valid Adaptive Card structure", () => {
      const card = createWelcomeCard();

      expect(card.type).toBe("AdaptiveCard");
      expect(card.version).toBe("1.4");
      expect(card.body).toBeDefined();
      expect(Array.isArray(card.body)).toBe(true);
      expect(card.actions).toBeDefined();
      expect(Array.isArray(card.actions)).toBe(true);
    });

    it("should include default welcome message", () => {
      const card = createWelcomeCard();
      const textBlocks = card.body.filter((item: { type: string }) => item.type === "TextBlock");

      expect(textBlocks[0].text).toContain("Welcome");
    });

    it("should personalize greeting when userName provided", () => {
      const card = createWelcomeCard({ userName: "John" });
      const textBlocks = card.body.filter((item: { type: string }) => item.type === "TextBlock");

      expect(textBlocks[0].text).toContain("John");
    });

    it("should include subscribe action", () => {
      const card = createWelcomeCard();
      const subscribeAction = card.actions.find(
        (action: { type: string; data?: { action: string } }) =>
          action.type === "Action.Submit" && action.data?.action === "subscribe"
      );

      expect(subscribeAction).toBeDefined();
    });

    it("should include link to timesheet", () => {
      const card = createWelcomeCard();
      const openUrlAction = card.actions.find(
        (action: { type: string; url?: string }) =>
          action.type === "Action.OpenUrl" && action.url?.includes("thyme.knowall.ai")
      );

      expect(openUrlAction).toBeDefined();
    });
  });

  describe("Reminder Card", () => {
    it("should create a valid Adaptive Card structure", () => {
      const card = createReminderCard({ hoursToday: 0 });

      expect(card.type).toBe("AdaptiveCard");
      expect(card.version).toBe("1.4");
      expect(card.body).toBeDefined();
      expect(card.actions).toBeDefined();
    });

    it("should show zero hours message when no hours logged", () => {
      const card = createReminderCard({ hoursToday: 0 });
      const textBlocks = card.body.filter((item: { type: string }) => item.type === "TextBlock");
      const hoursText = textBlocks.find((block: { text: string }) =>
        block.text.includes("haven't logged")
      );

      expect(hoursText).toBeDefined();
    });

    it("should show hours when hours are logged", () => {
      const card = createReminderCard({ hoursToday: 6.5 });
      const textBlocks = card.body.filter((item: { type: string }) => item.type === "TextBlock");
      const hoursText = textBlocks.find((block: { text: string }) =>
        block.text.includes("6.5")
      );

      expect(hoursText).toBeDefined();
    });

    it("should personalize greeting when userName provided", () => {
      const card = createReminderCard({ hoursToday: 4, userName: "Jane" });
      const textBlocks = card.body.filter((item: { type: string }) => item.type === "TextBlock");
      const greetingBlock = textBlocks.find((block: { text: string }) =>
        block.text.includes("Jane")
      );

      expect(greetingBlock).toBeDefined();
    });

    it("should include dismiss action", () => {
      const card = createReminderCard({ hoursToday: 0 });
      const dismissAction = card.actions.find(
        (action: { type: string; data?: { action: string } }) =>
          action.type === "Action.Submit" && action.data?.action === "dismiss"
      );

      expect(dismissAction).toBeDefined();
    });

    it("should include timesheet link action", () => {
      const card = createReminderCard({ hoursToday: 0 });
      const timesheetAction = card.actions.find(
        (action: { type: string; url?: string }) =>
          action.type === "Action.OpenUrl" && action.url?.includes("timesheet")
      );

      expect(timesheetAction).toBeDefined();
    });
  });

  describe("Status Card", () => {
    it("should create a valid Adaptive Card structure", () => {
      const card = createStatusCard(0, 0);

      expect(card.type).toBe("AdaptiveCard");
      expect(card.version).toBe("1.4");
      expect(card.body).toBeDefined();
      expect(card.actions).toBeDefined();
    });

    it("should display today hours", () => {
      const card = createStatusCard(4.5, 20);
      const columnSet = card.body.find(
        (item: { type: string }) => item.type === "ColumnSet"
      );

      expect(columnSet).toBeDefined();
      const content = JSON.stringify(columnSet);
      expect(content).toContain("4.5");
    });

    it("should display week hours", () => {
      const card = createStatusCard(4, 32.5);
      const content = JSON.stringify(card);

      expect(content).toContain("32.5");
    });

    it("should show week progress percentage", () => {
      const card = createStatusCard(8, 32);
      const progressText = card.body.find(
        (item: { type: string; text?: string }) =>
          item.type === "TextBlock" && item.text?.includes("progress")
      );

      expect(progressText).toBeDefined();
      expect(progressText.text).toContain("80"); // 32/40 = 80%
    });

    it("should cap progress at 100%", () => {
      const card = createStatusCard(10, 45);
      const progressText = card.body.find(
        (item: { type: string; text?: string }) =>
          item.type === "TextBlock" && item.text?.includes("progress")
      );

      expect(progressText.text).toContain("100");
    });

    it("should include links to timesheet and reports", () => {
      const card = createStatusCard(0, 0);

      expect(card.actions.length).toBeGreaterThanOrEqual(2);
      const timesheetAction = card.actions.find(
        (action: { url?: string }) => action.url?.includes("timesheet")
      );
      const reportsAction = card.actions.find(
        (action: { url?: string }) => action.url?.includes("reports")
      );

      expect(timesheetAction).toBeDefined();
      expect(reportsAction).toBeDefined();
    });
  });
});
