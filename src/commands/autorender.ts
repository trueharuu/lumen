import {
  ApplicationCommandRegistry,
  ChatInputCommand,
  Command,
} from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import { readFileSync, writeFileSync } from "node:fs";
import { lib_root } from "../util";

export class AutorenderCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Promise<void> {
    registry.registerChatInputCommand((b) =>
      b
        .setName("autorender")
        .setDescription("Fumen auto-render settings")
        .addSubcommand((t) =>
          t.setName("on").setDescription("Enables auto-render.")
        )
        .addSubcommand((t) =>
          t.setName("off").setDescription("Disables auto-render.")
        )
    );
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.RunContext
  ): Promise<void> {
    const uid = interaction.user.id;
    let disabled = readFileSync(
      lib_root() + "/no_autorender.txt",
      "utf8"
    ).split("\n");
    const scm = interaction.options.getSubcommand();

    if (scm === "on") {
      if (!disabled.includes(uid)) {
        await interaction.reply({
          content: "Auto-render is already enabled.",
          flags: ["Ephemeral"],
        });
        return;
      }

      disabled = disabled.filter((x) => x !== uid);

      await interaction.reply({
        content: "Enabled auto-render.",
        flags: ["Ephemeral"],
      });
    } else if (scm === "off") {
      if (disabled.includes(uid)) {
        await interaction.reply({
          content: "Auto-render is already disabled.",
          flags: ["Ephemeral"],
        });
        return;
      }

      disabled.push(uid);

      await interaction.reply({
        content: "Disabled auto-render.",
        flags: ["Ephemeral"],
      });
    }

    writeFileSync(
      lib_root() + "/no_autorender.txt",
      disabled.join("\n").trim()
    );
  }
}
