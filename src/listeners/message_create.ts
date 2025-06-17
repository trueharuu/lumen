import { Listener } from "@sapphire/framework";
import { Client, Events, Message, OmitPartialGroupDMChannel } from "discord.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { lib_root, render, thread_root } from "../util";
import { state } from "../state";

export class MessageCreateListener extends Listener<Events.MessageCreate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, { ...options, once: true, event: Events.MessageCreate });
  }

  public async run(
    message: OmitPartialGroupDMChannel<Message<boolean>>
  ): Promise<void> {
    const no_autorender = readFileSync(
      lib_root() + "/no_autorender.txt",
      "utf-8"
    ).split("\n");
    if (
      !no_autorender.includes(message.author.id) &&
      !message.content.includes("\u{E007E}")
    ) {
      const z = await render(message.content, message.reply.bind(message));
      if (z) {
        state.responded_messages.set(message.id, z.id);
      }
    }
  }
}
