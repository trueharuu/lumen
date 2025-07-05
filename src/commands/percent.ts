import { Command } from "@sapphire/framework";
import { InteractionContextType } from "discord.js";

import { clean, kick_table, respond_lengthy, sfinder } from "../util";
import { p_path, p_percent } from "../parser";
import {
  a_clear,
  a_drop_type,
  a_hold,
  a_kick_table,
  a_pattern,
  a_tetfu,
} from "../args";

export class PercentCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: Command.Registry
  ): Promise<void> {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("percent")
        .setDescription("Runs sfinder `percent`.")
        .addStringOption((c) => a_tetfu(c))
        .addStringOption((c) => a_pattern(c))
        .addStringOption((c) => a_hold(c))
        .addIntegerOption((c) => a_clear(c))
        .addStringOption((c) => a_kick_table(c))
        .addStringOption((c) => a_drop_type(c))
        .setContexts(InteractionContextType.Guild)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    await interaction.deferReply();
    const tetfu = interaction.options.getString("tetfu");
    const pattern = interaction.options.getString("pattern");
    const hold = interaction.options.getString("hold", false) ?? "use";
    const clear = interaction.options.getInteger("clear", false) ?? 4;
    const kicks =
      interaction.options.getString("kicks", false) ?? kick_table("srs");
    const drop_type =
      interaction.options.getString("drop_type", false) ?? "softdrop";

    const command = `percent -t ${tetfu} -p ${pattern} -H ${hold} -d ${drop_type} -K "${kicks}" -c ${clear} -td 0 -fc 0`;

    const result = sfinder(interaction, command);

    if (result.ok) {
      const t = p_percent(interaction);
      await interaction.editReply(respond_lengthy("", t, false));
    } else {
      await interaction.editReply(respond_lengthy(":warning:", result.text));
    }

    clean(interaction);

    // clean(interaction.user.id, interaction.id);
    // console.log(z);
  }
}
