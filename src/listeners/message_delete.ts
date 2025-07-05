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

export class MessageDeleteListener extends Listener<Events.MessageDelete> {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, { ...options, once: false, event: Events.MessageDelete });
  }

  public override async run(
    message: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>
  ): Promise<void> {
    const response = state.responded_messages.get(message.id);

    if (response) {
      const r = await message.channel.messages.fetch(response);
      r.delete();
    }
  }
}
