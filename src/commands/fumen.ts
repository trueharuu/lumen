import {
  ApplicationCommandRegistry,
  Awaitable,
  ChatInputCommand,
  Command,
} from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import { a_tetfu } from "../args";
import { clean, respond_lengthy } from "../util";
import glueFumen from "../gluingfumens/src/lib/glueFumen";
import { assemble } from "../ext/unglue";
import { decode } from "tetris-fumen/lib/decoder";
import { encode } from "tetris-fumen/lib/encoder";

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
        .addSubcommand((s) =>
          s
            .setName("split")
            .setDescription("Splits a multi-page fumen into multiple fumens")
            .addStringOption((c) => a_tetfu(c))
        )
        .addSubcommand((s) =>
          s
            .setName("join")
            .setDescription("Joins multiple fumens into one multi-page fumen")
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
        respond_lengthy("", glueFumen(tetfu).join("\n"), false)
      );
      clean(interaction);
      return;
    }

    if (scm === "unglue") {
      const tetfu = interaction.options.getString("tetfu", true);
      await interaction.editReply(
        respond_lengthy("", assemble(tetfu.split(" ")).join("\n"), false)
      );
      clean(interaction);
      return;
    }

    if (scm === "split") {
      const tetfu = interaction.options.getString("tetfu", true);
      const va = tetfu
        .split(/\s+/)
        .flatMap((x) => decode(x))
        .map((x) => "v115@" + encode([x]));
      await interaction.editReply(
        respond_lengthy("\u{E007E}", va.join("\n"), false)
      );
      clean(interaction);
      return;
    }

    if (scm === "split") {
      const tetfu = interaction.options.getString("tetfu", true);
      const fumens = encode(tetfu.split(" ").flatMap((x) => decode(x)));
      await interaction.editReply(respond_lengthy("", "v115@" + fumens, false));

      return;
    }
  }
}
