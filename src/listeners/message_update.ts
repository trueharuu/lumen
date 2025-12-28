import { Listener } from "@sapphire/framework";
import {
  Client,
  Events,
  Message,
  OmitPartialGroupDMChannel,
  PartialMessage,
  ReactionManager,
} from "discord.js";
import * as fs from "node:fs/promises";
import { lib_root, render, thread_root } from "../util";
import { state } from "../state";
import { deepStrictEqual } from "node:assert";

export class MessageUpdateListener extends Listener<Events.MessageUpdate> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, { ...options, once: false, event: Events.MessageUpdate });
  }

  public override async run(
    oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>,
    newMessage: OmitPartialGroupDMChannel<Message<boolean>>
  ): Promise<void> {
    const no_autorender = (await fs.readFile(
      lib_root() + "/no_autorender.txt",
      "utf-8"
    )).split("\n");

    if (
      !no_autorender.includes(newMessage.author.id) &&
      !newMessage.content.includes("\u{E007E}")
    ) {
      // console.log(`\x1b[31mrendering (update) ${newMessage.id} ${newMessage.channelId}\x1b[0m`);
      try { deepStrictEqual(oldMessage.toJSON(), newMessage.toJSON()); return; } catch { }
      // console.log(`\x1b[32mold ${JSON.stringify(oldMessage.toJSON())}\x1b[0m`);
      // console.log(`\x1b[33mnew ${JSON.stringify(newMessage.toJSON())}\x1b[0m`);
      const response = state.responded_messages.get(newMessage.id);
      if (response) {
        const r = await newMessage.channel.messages.fetch(response);
        await render(newMessage, r.edit.bind(r));
      } else {
        const z = await render(newMessage, newMessage.reply.bind(newMessage));
        if (z) {
          state.responded_messages.set(newMessage.id, z.id);
        }
      }
    }
  }
}
