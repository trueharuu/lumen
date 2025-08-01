import {
  ApplicationCommandRegistry,
  Awaitable,
  ChatInputCommand,
  Command,
} from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import {
  a_clear,
  a_color,
  a_drop_type,
  a_hold,
  a_kick_table,
  a_pattern,
  a_piece,
  a_tetfu,
  choice,
} from "../args";
import { clean, kick_table, respond_lengthy, sfinder } from "../util";
import { p_setup } from "../parser";
import { decode } from "tetris-fumen/lib/decoder";
import { Field, Page } from "tetris-fumen";
import { encode } from "tetris-fumen/lib/encoder";

export class SetupCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Promise<void> {
    registry.registerChatInputCommand((b) =>
      b
        .setName("congruents")
        .setDescription("Returns all ways to stack a setup.")
        .addStringOption((c) => a_tetfu(c))
        .addStringOption((c) => a_pattern(c))
        .addStringOption((c) => a_color(c).setRequired(true))
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

    let tetfu = interaction.options.getString("tetfu", true);
    const pattern = interaction.options.getString("pattern", true);
    let color = interaction.options.getString("color", true);
    const hold = interaction.options.getString("hold", false) ?? "use";
    const kicks =
      interaction.options.getString("kicks", false) ?? kick_table("srs");
    const drop_type =
      interaction.options.getString("drop_type", false) ?? "softdrop";

    if (color === "colored") {
      color = "I";
      tetfu = this.recolor(tetfu, "IJOLZST", "I");
    }

    if (color === "all") {
      color = "I";
      tetfu = this.recolor(tetfu, "IJOLZSTX", "I");
    }

    if (color === "garbage") {
      color = "I";
      // :stare:
      tetfu = this.recolor(tetfu, "IJOLZST", "O");
      tetfu = this.recolor(tetfu, "X", "I");
      tetfu = this.recolor(tetfu, "O", "X");
    }

    const pages = decode(tetfu);

    const results: Set<string> = new Set();
    for (const page of pages) {
      const tet = "v115@" + encode([page]);
      const command = `setup -t ${tet} -p ${pattern} -H ${hold} -K ${kicks} -d ${drop_type} -f ${color}`;
      const result = sfinder(interaction, command);
      if (result.ok) {
        const congruents = p_setup(interaction);

        if (congruents) {
          for (const congruent of decode(congruents)) {
            results.add("v115@" + encode([congruent]));
          }
        }
      } else {
        await interaction.editReply(respond_lengthy(":warning:", result.text));
        return;
      }
    }

    interaction.editReply(
      respond_lengthy(
        "",
        "v115@" +
          encode(
            results
              .values()
              .flatMap((x) => decode(x))
              .toArray()
          ),
        false
      )
    );
  }

  public recolor(tetfu: string, from: string, to: string): string {
    const opts = { garbage: false, separator: "" };
    return (
      "v115@" +
      encode(
        decode(tetfu).map((x) => {
          
          
          //   x.field.str(opts).replace(/./g, ($) => (from.includes($) ? to : $))
          // );
          x.field = Field.create(
            x.field.str(opts).replace(/./g, ($) => (from.includes($) ? to : $))
          );

          return x;
        })
      )
    );
  }
}
