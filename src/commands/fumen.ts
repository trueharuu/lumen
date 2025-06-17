import {
  ApplicationCommandRegistry,
  Awaitable,
  ChatInputCommand,
  Command,
} from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import { a_tetfu } from "../args";
import { fumenutil, respond_lengthy } from "../util";

export class FumenCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Promise<void> {
    registry.registerChatInputCommand((b) =>
      b
        .setName("fumen")
        .setDescription("General fumen operations")
        .addSubcommand((s) =>
          s
            .setName("glue")
            .setDescription('Optimizes a fumen by "gluing" it')
            .addStringOption((c) => a_tetfu(c))
        )
        .addSubcommand((s) =>
          s
            .setName("unglue")
            .setDescription('Deoptimizes a fumen by "un-gluing" it')
            .addStringOption((c) => a_tetfu(c))
        )
    );
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.RunContext
  ): Promise<void> {
    await interaction.deferReply();
    const scm = interaction.options.getSubcommand(true);
    if (scm === "glue") {
      const tetfu = interaction.options.getString("tetfu", true);
      await interaction.editReply(
        respond_lengthy("", fumenutil(`glue ${tetfu}`), false)
      );
    }
  }
}
