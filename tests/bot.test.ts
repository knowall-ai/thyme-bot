import { TurnContext, Activity, ChannelAccount } from "botbuilder";
import { ThymeBot } from "../src/bot";

// Mock the dependencies
jest.mock("../src/services/subscriptionStore");
jest.mock("../src/services/thymeApiClient");

describe("ThymeBot", () => {
  let bot: ThymeBot;
  let mockContext: Partial<TurnContext>;
  let mockActivity: Partial<Activity>;

  beforeEach(() => {
    bot = new ThymeBot();

    mockActivity = {
      type: "message",
      text: "",
      from: { id: "test-user-id", name: "Test User" } as ChannelAccount,
      recipient: { id: "bot-id", name: "Thyme Bot" } as ChannelAccount,
      conversation: {
        id: "conv-id",
        tenantId: "tenant-id",
        isGroup: false,
        conversationType: "personal",
        name: "Test Conversation",
      },
      channelId: "msteams",
      serviceUrl: "https://smba.trafficmanager.net/",
      entities: [],
      locale: "en-US",
    };

    mockContext = {
      activity: mockActivity as Activity,
      sendActivity: jest.fn().mockResolvedValue({}),
    };
  });

  describe("Message Handling", () => {
    it("should respond to help command", async () => {
      mockActivity.text = "help";

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalled();
      const call = (mockContext.sendActivity as jest.Mock).mock.calls[0][0];
      expect(call.attachments).toBeDefined();
      expect(call.attachments[0].contentType).toBe("application/vnd.microsoft.card.adaptive");
    });

    it("should respond to ? as help", async () => {
      mockActivity.text = "?";

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalled();
    });

    it("should respond to unknown commands with help suggestion", async () => {
      mockActivity.text = "random command";

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalledWith(expect.stringContaining("help"));
    });

    it("should handle subscribe command", async () => {
      mockActivity.text = "subscribe";

      // Mock TeamsInfo
      jest.mock("botbuilder", () => ({
        ...jest.requireActual("botbuilder"),
        TeamsInfo: {
          getMember: jest.fn().mockResolvedValue({
            id: "test-user-id",
            userPrincipalName: "test@example.com",
          }),
        },
      }));

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalled();
    });

    it("should handle unsubscribe command", async () => {
      mockActivity.text = "unsubscribe";

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalled();
    });

    it("should handle status command", async () => {
      mockActivity.text = "status";

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalled();
    });
  });

  describe("Card Actions", () => {
    it("should handle subscribe action from card", async () => {
      mockActivity.text = "";
      mockActivity.value = { action: "subscribe" };

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalled();
    });

    it("should handle dismiss action from card", async () => {
      mockActivity.text = "";
      mockActivity.value = { action: "dismiss" };

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalledWith(expect.stringContaining("all set"));
    });
  });

  describe("Custom Reminder Time", () => {
    it("should parse remind me at 4:30pm format", async () => {
      mockActivity.text = "remind me at 4:30pm";

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalled();
      const call = (mockContext.sendActivity as jest.Mock).mock.calls[0][0];
      expect(call).toContain("16:30");
    });

    it("should parse remind me at 17:00 format", async () => {
      mockActivity.text = "remind me at 17:00";

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalled();
    });

    it("should handle invalid time format", async () => {
      mockActivity.text = "remind me at sometime";

      await bot.run(mockContext as TurnContext);

      expect(mockContext.sendActivity).toHaveBeenCalledWith(
        expect.stringContaining("couldn't understand")
      );
    });
  });
});
