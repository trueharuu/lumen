import {
  ApplicationCommandRegistry,
  Awaitable,
  ChatInputCommand,
  Command,
} from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import {
  a_clear,
  a_drop_type,
  a_hold,
  a_kick_table,
  a_pattern,
  a_piece,
  a_tetfu,
  choice,
} from "../args";
import { kick_table, respond_lengthy, sfinder } from "../util";
import { p_setup } from "../parser";

export class SetupCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Promise<void> {
    registry.registerChatInputCommand((b) =>
      b
        .setName("setup")
        .setDescription("Runs sfinder `setup`.")
        .addStringOption((c) => a_tetfu(c))
        .addStringOption((c) => a_pattern(c))
        .addStringOption((c) => a_piece(c).setName("fill"))
        .addStringOption((c) => a_piece(c).setName("margin"))
        .addStringOption((c) => a_piece(c).setName("free"))
        .addIntegerOption((c) => a_clear(c))
        .addStringOption((c) => a_hold(c))
        .addStringOption((c) => a_kick_table(c))
        .addStringOption((c) => a_drop_type(c))
        .addStringOption((c) =>
          c
            .setName("exclude")
            .setDescription('Exclude solutions that have a "hole"')
            .addChoices(choice("holes"), choice("strict-holes"), choice("none"))
        )
        .addIntegerOption((c) =>
          c
            .setName("n")
            .setDescription("Amount of pieces to use")
            .setRequired(false)
        )
    );
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.RunContext
  ): Promise<void> {
    await interaction.deferReply();

    const tetfu = interaction.options.getString("tetfu", true);
    const pattern = interaction.options.getString("pattern", true);
    const fill = interaction.options.getString("fill", false);
    const margin = interaction.options.getString("margin", false);
    const free = interaction.options.getString("free", false);
    const clear = interaction.options.getInteger("clear", false);
    const hold = interaction.options.getString("hold", false) ?? "use";
    const kicks =
      interaction.options.getString("kicks", false) ?? kick_table("srs");
    const drop_type =
      interaction.options.getString("drop_type", false) ?? "softdrop";
    const exclude = interaction.options.getString("exclude", false) ?? "none";
    const n = interaction.options.getInteger("n", false);

    const command = `setup -t ${tetfu} -p ${pattern} ${fill ? `-f ${fill}` : ""} ${margin ? `-m ${margin}` : ""} ${free ? `-F ${free}` : ""} ${clear ? `-l ${clear}` : ""} -H ${hold} -K ${kicks} -d ${drop_type} -e ${exclude} ${n ? `-np ${n}` : ""}`;

    const result = sfinder(interaction, command);

    if (result.ok) {
      const t = p_setup(interaction);
      await interaction.editReply(respond_lengthy("", t, false));
    } else {
      await interaction.editReply(respond_lengthy(":warning:", result.text));
    }
  }
}
