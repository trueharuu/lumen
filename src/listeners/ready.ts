import { Listener } from "@sapphire/framework";
import { Client, Events } from "discord.js";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { lib_root, thread_root } from "../util";

export class ReadyListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, { ...options, once: true, event: Events.ClientReady });
  }

  public run(client: Client) {
    client.logger.info("ready");
    if (!existsSync(thread_root())) {
      mkdirSync(thread_root());
    }

    if (!existsSync(lib_root() + "/no_autorender.txt")) {
      writeFileSync(lib_root() + "/no_autorender.txt", "");
    }
  }
}
