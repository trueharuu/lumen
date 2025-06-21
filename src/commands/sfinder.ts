import { Command } from "@sapphire/framework";
import { InteractionContextType } from "discord.js";

import { clean, respond_lengthy, sfinder } from "../util";

export class SfinderCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: Command.Registry
  ): Promise<void> {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("sfinder")
        .setDescription("Runs an sfinder command.")
        .addStringOption((c) =>
          c.setName("arg").setDescription("Command to run.")
        )
        .setContexts(InteractionContextType.Guild)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    await interaction.deferReply();
    const t = interaction.options.getString("arg");
    const z = sfinder(interaction, t || "");
    await interaction.editReply(
      respond_lengthy(z.ok ? "" : ":warning:", z.text)
    );
    // clean(interaction.user.id);
    // console.log(z);
  }
}
