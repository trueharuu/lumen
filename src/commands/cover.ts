import { Command } from "@sapphire/framework";
import { InteractionContextType } from "discord.js";

import { clean, kick_table, respond_lengthy, sfinder } from "../util";
import { p_cover } from "../parser";
import {
  a_clear,
  a_cover_mode,
  a_drop_type,
  a_hold,
  a_kick_table,
  a_pattern,
  a_tetfu,
} from "../args";
import glueFumen from "../gluingfumens/src/lib/glueFumen";

export class CoverCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: Command.Registry
  ): Promise<void> {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("cover")
        .setDescription("Runs sfinder `cover`.")
        .addStringOption((c) => a_tetfu(c))
        .addStringOption((c) => a_pattern(c))
        .addStringOption((c) => a_hold(c))
        .addBooleanOption((c) =>
          c.setName("mirror").setDescription("Whether to mirror setups")
        )
        .addStringOption((c) => a_kick_table(c))
        .addStringOption((c) => a_drop_type(c))
        .addStringOption((c) => a_cover_mode(c))
        .addIntegerOption((c) =>
          c
            .setName("starting_b2b")
            .setDescription("Minimum B2B needed from the start")
        )
        .addBooleanOption((c) =>
          c
            .setName("priority")
            .setDescription(
              'Whether if setups matched first take "priority" over others'
            )
        )
        .addIntegerOption((c) =>
          c
            .setName("last_sd")
            .setDescription(
              "Amount of pieces at the end of queue where softdrop is enabled"
            )
        )
        .addIntegerOption((c) =>
          c
            .setName("max_sd")
            .setDescription("Maximum number of soft-dropped pieces")
        )
        .addIntegerOption((c) => a_clear(c))
        .setContexts(InteractionContextType.Guild)
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    await interaction.deferReply();
    const tetfu = interaction.options.getString("tetfu", true);
    const pattern = interaction.options.getString("pattern", true);
    const hold = interaction.options.getString("hold", false) ?? "use";
    const mirror = interaction.options.getBoolean("mirror", false) ?? false;
    const kicks =
      interaction.options.getString("kicks", false) ?? kick_table("srs");
    const drop_type =
      interaction.options.getString("drop_type", false) ?? "softdrop";
    const cover_mode =
      interaction.options.getString("cover_mode", false) ?? "normal";
    const starting_b2b =
      interaction.options.getInteger("starting_b2b", false) ?? 0;
    const priority = interaction.options.getBoolean("priority", false) ?? false;
    const last_sd = interaction.options.getInteger("last_sd", false) ?? 0;
    const max_sd = interaction.options.getInteger("max_sd", false) ?? -1;
    const clear = interaction.options.getInteger("clear", false) ?? -1;

    const gf = tetfu
      .split(" ")
      .flatMap((x) => glueFumen(x))
      .join(" ");
    // console.log(gf);
    const command = `cover -t ${gf} -p ${pattern} -H ${hold} -d ${drop_type} -K ${kicks} -m ${mirror ? "yes" : "no"} -M ${cover_mode} -mc ${clear} -ms ${max_sd} -P ${priority ? "yes" : "no"} -l ${last_sd} -sb ${starting_b2b}`;

    const result = sfinder(interaction, command);

    if (result.ok) {
      const t = p_cover(interaction, cover_mode);
      interaction.editReply(respond_lengthy("", t, false));
    } else {
      interaction.editReply(respond_lengthy(":warning:", result.text));
    }
    
    clean(interaction);
  }
}
