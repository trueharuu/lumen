import {
  ApplicationCommandRegistry,
  Awaitable,
  ChatInputCommand,
  Command,
} from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import { a_drop_type, a_hold, a_kick_table, a_pattern, a_tetfu } from "../args";
import { clean, kick_table, respond_lengthy, sfinder } from "../util";
import { p_ren } from "../parser";

export class RenCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Promise<void> {
    registry.registerChatInputCommand((b) =>
      b
        .setName("ren")
        .setDescription("Runs sfinder `ren`.")
        .addStringOption((c) => a_tetfu(c))
        .addStringOption((c) => a_pattern(c))
        .addStringOption((c) => a_hold(c))
        .addStringOption((c) => a_kick_table(c))
        .addStringOption((c) => a_drop_type(c))
    );
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.RunContext
  ): Promise<void> {
    await interaction.deferReply();

    const tetfu = interaction.options.getString("tetfu", true);
    const pattern = interaction.options.getString("pattern", true);
    const hold = interaction.options.getString("hold", false) ?? "use";
    const kicks =
      interaction.options.getString("kicks", false) ?? kick_table("srs");
    const drop_type =
      interaction.options.getString("drop_type", false) ?? "softdrop";

    const command = `ren -t ${tetfu} -p ${pattern} -H ${hold} -d ${drop_type} -K "${kicks}"`;
    const result = sfinder(interaction, command);

    if (result.ok) {
      const t = p_ren(interaction);
      await interaction.editReply(respond_lengthy("", t, false));
    } else {
      await interaction.editReply(respond_lengthy(":warning:", result.text));
    }

    clean(interaction);
  }
}
