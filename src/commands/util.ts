import { Command } from "@sapphire/framework";
import {
  Attachment,
  AttachmentBuilder,
  InteractionContextType,
} from "discord.js";

import {
  clean,
  instance,
  respond_lengthy,
  sfinder,
  spawn,
  theme,
} from "../util";
import { a_pattern, a_tetfu, choice } from "../args";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

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
            .addStringOption((c) => a_pattern(c))
        )
        .addSubcommand((c) =>
          c
            .setName("fig")
            .setDescription("Displays an image of a fumen.")
            .addStringOption((c) => a_tetfu(c))
            .addStringOption((c) =>
              c
                .setName("theme")
                .setDescription("The theme of the image.")
                .addChoices(
                  choice("default"),
                  choice("mipi"),
                  choice("fumen"),
                  choice("four")
                )
                .setRequired(false)
            )
            .addIntegerOption((c) =>
              c
                .setName("delay")
                .setDescription(
                  "The delay (in centiseconds) between frames in GIF output"
                )
                .setRequired(false)
            )
            .addIntegerOption((c) =>
              c
                .setName("start")
                .setDescription("The first frame of the fumen to render.")
                .setRequired(false)
            )
            .addIntegerOption((c) =>
              c
                .setName("end")
                .setDescription("The last frame of the fumen to render.")
                .setRequired(false)
            )

            .addStringOption((c) =>
              c
                .setName("frame")
                .setDescription("Which elements to display in the render")
                .addChoices(
                  choice("hold queue on left, next queue on right", "basic"),
                  choice("hold queue and next queue on right", "right"),
                  choice("no hold queue or next queue", "no")
                )
                .setRequired(false)
            )
            .addStringOption((c) =>
              c
                .setName("format")
                .setDescription("Image format.")
                .addChoices(choice("gif"), choice("png"))
                .setRequired(false)
            )
            .addStringOption((c) =>
              c
                .setName("hold")
                .setDescription("Whether to display the hold queue.")
                .addChoices(choice("visible"), choice("hidden"))
                .setRequired(false)
            )
            .addIntegerOption((c) =>
              c
                .setName("line")
                .setDescription(
                  "The amount of lines from the bottom to render."
                )
                .setRequired(false)
            )
            .addIntegerOption((c) =>
              c
                .setName("next")
                .setDescription(
                  "The amount of pieces from the next queue to render."
                )
                .setRequired(false)
            )
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
    } else if (scm === "fig") {
      const tetfu = interaction.options.getString("tetfu", true);
      const th = interaction.options.getString("theme", false) ?? "default";
      const delay = interaction.options.getInteger("delay", false) ?? 30;
      const start = interaction.options.getInteger("start", false) ?? 1;
      const end = interaction.options.getInteger("end", false) ?? -1;
      const frame = interaction.options.getString("frame", false) ?? "basic";
      const format = interaction.options.getString("format", false) ?? "gif";
      const hold = interaction.options.getString("hold", false) ?? "visible";
      const line = interaction.options.getInteger("line", false) ?? -1;
      const next = interaction.options.getInteger("next", false) ?? 5;

      spawn(interaction);
      mkdirSync(instance(interaction) + "/theme");
      writeFileSync(
        instance(interaction) + "/theme/" + th + ".properties",
        readFileSync(theme(th), "utf-8")
      );
      const command = `util fig -t ${tetfu} -c ${th} -d ${delay} -s ${start} -e ${end} -f ${frame} -F ${format} -H ${hold} -l ${line} -n ${next}`;
      const result = sfinder(interaction, command);

      if (result.ok) {
        const t = readFileSync(instance(interaction) + "/output/fig." + format);

        await interaction.editReply({
          files: [new AttachmentBuilder(t).setName("fig." + format)],
        });
      } else {
        interaction.editReply(respond_lengthy(":warning:", result.text));
      }
    }
  }
}
