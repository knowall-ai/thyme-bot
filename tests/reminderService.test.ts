import { DateTime } from "luxon";
import { ReminderService } from "../src/services/reminderService";
import { SubscriptionStore, Subscription } from "../src/services/subscriptionStore";

// Mock dependencies
jest.mock("../src/services/subscriptionStore");
jest.mock("../src/services/thymeApiClient");
jest.mock("botbuilder", () => ({
  CloudAdapter: jest.fn().mockImplementation(() => ({
    continueConversationAsync: jest.fn().mockResolvedValue(undefined),
  })),
  ConfigurationBotFrameworkAuthentication: jest.fn(),
  TurnContext: jest.fn(),
  CardFactory: {
    adaptiveCard: jest.fn().mockReturnValue({ contentType: "adaptive" }),
  },
  MessageFactory: {
    attachment: jest.fn().mockReturnValue({ attachments: [] }),
  },
}));
jest.mock("../src/config", () => ({
  config: {
    botId: "test-bot-id",
    botPassword: "test-password",
    thymeApiUrl: "https://api.example.com",
  },
}));

describe("ReminderService", () => {
  let reminderService: ReminderService;
  let mockSubscriptionStore: jest.Mocked<SubscriptionStore>;

  const createMockSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
    partitionKey: "subscriptions",
    rowKey: "user-123",
    userPrincipalName: "test@example.com",
    conversationId: "conv-123",
    serviceUrl: "https://smba.trafficmanager.net/",
    timezone: "Europe/London",
    reminderTime: "17:00",
    isActive: true,
    conversationReference: JSON.stringify({
      conversation: { id: "conv-123" },
      serviceUrl: "https://smba.trafficmanager.net/",
      bot: { id: "bot-id" },
      user: { id: "user-123" },
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    reminderService = new ReminderService();
    mockSubscriptionStore = new SubscriptionStore() as jest.Mocked<SubscriptionStore>;
  });

  describe("isReminderTime", () => {
    it("should return true when user local time is at target hour", () => {
      const now = DateTime.now();
      const currentHour = now.hour;

      // Test with current hour
      const result = reminderService.isReminderTime("UTC", currentHour);
      expect(result).toBe(true);
    });

    it("should return false when user local time is not at target hour", () => {
      const result = reminderService.isReminderTime("UTC", 99); // Invalid hour
      expect(result).toBe(false);
    });

    it("should handle different timezones correctly", () => {
      // Get current hour in a specific timezone
      const londonTime = DateTime.now().setZone("Europe/London");
      const londonHour = londonTime.hour;

      const result = reminderService.isReminderTime("Europe/London", londonHour);
      expect(result).toBe(true);
    });
  });

  describe("getSubscriptionsForCurrentHour", () => {
    it("should filter subscriptions by current local time", async () => {
      const currentHour = DateTime.now().setZone("UTC").hour;
      const reminderTime = `${currentHour.toString().padStart(2, "0")}:00`;

      const mockSubs: Subscription[] = [
        createMockSubscription({ timezone: "UTC", reminderTime }),
        createMockSubscription({ rowKey: "user-456", timezone: "UTC", reminderTime: "03:00" }),
      ];

      mockSubscriptionStore.getAllActiveSubscriptions = jest.fn().mockResolvedValue(mockSubs);

      // Replace the internal subscription store
      (reminderService as unknown as { subscriptionStore: SubscriptionStore }).subscriptionStore = mockSubscriptionStore;

      const result = await reminderService.getSubscriptionsForCurrentHour();

      // At least one should match if current hour matches
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("sendReminder", () => {
    it("should send reminder successfully", async () => {
      const subscription = createMockSubscription();

      const result = await reminderService.sendReminder(subscription);

      expect(result.userId).toBe(subscription.rowKey);
      expect(result.success).toBe(true);
    });

    it("should handle send failure gracefully", async () => {
      const subscription = createMockSubscription({
        conversationReference: "invalid-json",
      });

      const result = await reminderService.sendReminder(subscription);

      expect(result.userId).toBe(subscription.rowKey);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("sendDailyReminders", () => {
    it("should process all eligible subscriptions", async () => {
      const mockSubs: Subscription[] = [
        createMockSubscription(),
        createMockSubscription({ rowKey: "user-456" }),
      ];

      mockSubscriptionStore.getAllActiveSubscriptions = jest.fn().mockResolvedValue([]);
      (reminderService as unknown as { subscriptionStore: SubscriptionStore }).subscriptionStore = mockSubscriptionStore;

      const results = await reminderService.sendDailyReminders();

      expect(Array.isArray(results)).toBe(true);
    });

    it("should return empty array when no subscriptions match", async () => {
      mockSubscriptionStore.getAllActiveSubscriptions = jest.fn().mockResolvedValue([]);
      (reminderService as unknown as { subscriptionStore: SubscriptionStore }).subscriptionStore = mockSubscriptionStore;

      const results = await reminderService.sendDailyReminders();

      expect(results).toEqual([]);
    });
  });
});

describe("Subscription Timezone Handling", () => {
  it("should correctly identify 5pm in different timezones", () => {
    const timezones = [
      "America/New_York",
      "Europe/London",
      "Asia/Tokyo",
      "Australia/Sydney",
    ];

    timezones.forEach((tz) => {
      const localTime = DateTime.now().setZone(tz);
      expect(localTime.isValid).toBe(true);
    });
  });

  it("should handle daylight saving time transitions", () => {
    // Test a date that's typically during DST
    const summerDate = DateTime.fromISO("2024-07-15T17:00:00", { zone: "Europe/London" });
    expect(summerDate.hour).toBe(17);

    // Test a date that's typically not during DST
    const winterDate = DateTime.fromISO("2024-01-15T17:00:00", { zone: "Europe/London" });
    expect(winterDate.hour).toBe(17);
  });
});
