import { Listener } from "@sapphire/framework";
import { Client, Events } from "discord.js";
import * as fs from "node:fs/promises";
import { lib_root, thread_root } from "../util";

export class ReadyListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options
  ) {
    super(context, { ...options, once: true, event: Events.ClientReady });
  }

  public async run(client: Client) {
    client.logger.info("ready");
    if (!(await fs.stat(thread_root()).catch(() => false))) {
      await fs.mkdir(thread_root());
    }

    if (!(await fs.stat(lib_root() + "/no_autorender.txt").catch(() => false))) {
      await fs.writeFile(lib_root() + "/no_autorender.txt", "");
    }
  }
}
