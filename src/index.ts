import {
  SapphireClient,
} from "@sapphire/framework";
import { GatewayIntentBits, Routes } from "discord.js";
import { REST } from "discord.js";
import { config } from "dotenv";
import { tracing } from "./tracing";
config();

export const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  logger: { instance: tracing },
  defaultPrefix: null,
  disableMentionPrefix: true,
});
export const rest = new REST().setToken(process.env.TOKEN!);

(async () => {
  await client.login(process.env.TOKEN);
})();
