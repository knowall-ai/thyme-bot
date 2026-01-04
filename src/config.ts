import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface Config {
  botId: string;
  botPassword: string;
  botDomain: string;
  botEndpoint: string;
  thymeAppUrl: string;
  thymeApiUrl: string;
  azureStorageConnectionString?: string;
  port: number;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue || "";
}

// Validate bot credentials at startup to fail fast
function validateBotCredentials(botId: string, botPassword: string): void {
  if (!botId || !botPassword) {
    console.warn(
      "Warning: BOT_ID and/or BOT_PASSWORD are not set. " +
        "The bot will not be able to authenticate with Azure Bot Service. " +
        "This is expected during local development without tunneling."
    );
  }
}

const botId = getEnvVar("BOT_ID", "");
const botPassword = getEnvVar("BOT_PASSWORD", "");

validateBotCredentials(botId, botPassword);

export const config: Config = {
  botId,
  botPassword,
  botDomain: getEnvVar("BOT_DOMAIN", ""),
  botEndpoint: getEnvVar("BOT_ENDPOINT", ""),
  thymeAppUrl: getEnvVar("THYME_APP_URL", "https://thyme.knowall.ai"),
  thymeApiUrl: getEnvVar("THYME_API_URL", "https://thyme.knowall.ai/api"),
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  port: parseInt(getEnvVar("PORT", "3978"), 10),
};
