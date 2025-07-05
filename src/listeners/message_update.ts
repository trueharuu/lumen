import { Listener } from "@sapphire/framework";
import {
  Client,
  Events,
  Message,
  OmitPartialGroupDMChannel,
  PartialMessage,
} from "discord.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { lib_root, render, thread_root } from "../util";
import { state } from "../state";

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
    const no_autorender = readFileSync(
      lib_root() + "/no_autorender.txt",
      "utf-8"
    ).split("\n");
    if (
      !no_autorender.includes(newMessage.author.id) &&
      !newMessage.content.includes("\u{E007E}")
    ) {
      const response = state.responded_messages.get(newMessage.id);
      if (response) {
        const r = await newMessage.channel.messages.fetch(response);
        await render(newMessage.content, r.edit.bind(r));
      } else {
        const z = await render(newMessage.content, newMessage.reply.bind(newMessage));
        if (z) {
          state.responded_messages.set(newMessage.id, z.id);
        }
      }
    }
  }
}
