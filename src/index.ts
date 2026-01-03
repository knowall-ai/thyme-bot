import express, { Request, Response } from "express";
import {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  ConfigurationBotFrameworkAuthenticationOptions,
} from "botbuilder";
import { ThymeBot } from "./bot";
import { config } from "./config";

// Create express app
const app = express();
app.use(express.json());

// Create bot framework authentication
const botFrameworkAuth = new ConfigurationBotFrameworkAuthentication(
  {} as ConfigurationBotFrameworkAuthenticationOptions,
  {
    MicrosoftAppId: config.botId,
    MicrosoftAppPassword: config.botPassword,
    MicrosoftAppType: "MultiTenant",
  }
);

// Create adapter
const adapter = new CloudAdapter(botFrameworkAuth);

// Error handler
adapter.onTurnError = async (context, error) => {
  console.error(`[onTurnError] Unhandled error: ${error}`);
  console.error(error.stack);

  // Send a message to the user
  await context.sendActivity("Sorry, something went wrong. Please try again.");
};

// Create the bot
const bot = new ThymeBot();

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Bot messages endpoint
app.post("/api/messages", async (req: Request, res: Response) => {
  await adapter.process(req, res, (context) => bot.run(context));
});

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`Thyme Bot listening on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Bot endpoint: http://localhost:${port}/api/messages`);
});
