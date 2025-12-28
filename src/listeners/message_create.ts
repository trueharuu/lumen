import { Listener } from "@sapphire/framework";
import { Client, Events, Message, OmitPartialGroupDMChannel } from "discord.js";
import * as fs from "node:fs/promises";
import { lib_root, render, thread_root } from "../util";
import { state } from "../state";

export class MessageCreateListener extends Listener<Events.MessageCreate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    console.log('ok listening!');
    super(context, { ...options, once: false, event: Events.MessageCreate });
  }

  public async run(
    message: OmitPartialGroupDMChannel<Message<boolean>>
  ): Promise<void> {
    const no_autorender = (await fs.readFile(
      lib_root() + "/no_autorender.txt",
      "utf-8"
    )).split("\n");
    
    if (
      !no_autorender.includes(message.author.id) &&
      !message.content.includes("\u{E007E}")
    ) {
      // console.log(`\x1b[31mrendering ${message.id} ${message.channelId}\x1b[0m`);
      const z = await render(message, message.reply.bind(message));
      if (z) {
        state.responded_messages.set(message.id, z.id);
      }
    }
  }
}
