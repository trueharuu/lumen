import { Command } from "@sapphire/framework";
import { InteractionContextType } from "discord.js";

import { clean, respond_lengthy, sfinder } from "../util";
import { a_pattern } from "../args";

export class UtilCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: Command.Registry
  ): Promise<void> {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("util")
        .setDescription("sfinder `util` group.")
        .addSubcommand((c) =>
          c
            .setName("seq")
            .setDescription(
              "Returns all queues described by an sfinder pattern."
            )
            .addStringOption((c) => a_pattern(c).setRequired(true))
        )
        .setContexts(InteractionContextType.Guild)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    await interaction.deferReply();
    const scm = interaction.options.getSubcommand();
    if (scm === "seq") {
      const pattern = interaction.options.getString("pattern");
      const command = `util seq -p ${pattern}`;
      const result = sfinder(interaction, command);

      if (result.ok) {
        await interaction.editReply(respond_lengthy("", result.text));
      } else {
        await interaction.editReply(respond_lengthy(":warning:", result.text));
      }

      clean(interaction);
    }
  }
}
