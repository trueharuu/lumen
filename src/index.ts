import {
  ApplicationCommandRegistries,
  Logger,
  LogLevel,
  SapphireClient,
} from "@sapphire/framework";
import { GatewayIntentBits, Routes } from "discord.js";
import { REST } from "discord.js";
import { config } from "dotenv";
import { Tracing } from "./tracing";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { lib_root, thread_root } from "./util";
config();

export const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  logger: { instance: new Tracing(LogLevel.Info) },
  defaultPrefix: null,
  disableMentionPrefix: true,
});
export const rest = new REST().setToken(process.env.TOKEN!);

(async () => {
  ApplicationCommandRegistries.setDefaultGuildIds([
    "1031692332824793089",
    "1384394244051177642",
  ]);
  await client.login(process.env.TOKEN);
})();
