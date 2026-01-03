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

export const config: Config = {
  botId: getEnvVar("BOT_ID", ""),
  botPassword: getEnvVar("BOT_PASSWORD", ""),
  botDomain: getEnvVar("BOT_DOMAIN", ""),
  botEndpoint: getEnvVar("BOT_ENDPOINT", ""),
  thymeAppUrl: getEnvVar("THYME_APP_URL", "https://thyme.knowall.ai"),
  thymeApiUrl: getEnvVar("THYME_API_URL", "https://thyme.knowall.ai/api"),
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  port: parseInt(getEnvVar("PORT", "3978"), 10),
};
