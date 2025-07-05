import {
  APIApplicationCommandOptionChoice,
  SlashCommandIntegerOption,
  SlashCommandStringOption,
} from "discord.js";
import { kick_tables } from "./util";

export function choice(
  s: string,
  v: string = s
): APIApplicationCommandOptionChoice<string> {
  return { name: s, value: v };
}

export function a_kick_table(
  c: SlashCommandStringOption
): SlashCommandStringOption {
  return c
    .setName("kicks")
    .setDescription("Kick table to use")
    .setChoices(kick_tables())
    .setRequired(false);
}

export function a_hold(c: SlashCommandStringOption): SlashCommandStringOption {
  return c
    .setName("hold")
    .setDescription("Whether to use hold")
    .setChoices(choice("use"), choice("avoid"))
    .setRequired(false);
}

export function a_clear(
  c: SlashCommandIntegerOption
): SlashCommandIntegerOption {
  return c
    .setName("clear")
    .setDescription("Maximum amount of cleared lines")
    .setRequired(false);
}

export function a_drop_type(
  c: SlashCommandStringOption
): SlashCommandStringOption {
  return c
    .setName("drop_type")
    .setDescription("Drop type to use")
    .setChoices(
      choice("soft drop", "softdrop"),
      choice("hard drop", "harddrop"),
      choice("soft drop + 180s", "softdrop180"),
      choice("soft drop (only T)", "softdroptonly"),
      choice("soft drop (only TS0s and above)", "tspinzero"),
      choice("soft drop (only TSMs and above)", "tspinm"),
      choice("soft drop (only TSSs and above)", "tspin1"),
      choice("soft drop (only TSDs and above)", "tspin2"),
      choice("soft drop (only TSTs)", "tspin3")
    )
    .setRequired(false);
}

export function a_pattern(
  c: SlashCommandStringOption
): SlashCommandStringOption {
  return c
    .setName("pattern")
    .setDescription("Patterns to use")
    .setRequired(true);
}

export function a_tetfu(c: SlashCommandStringOption): SlashCommandStringOption {
  return c
    .setName("tetfu")
    .setDescription("Initial board state")
    .setRequired(true);
}

export function a_cover_mode(
  c: SlashCommandStringOption
): SlashCommandStringOption {
  return c
    .setName("cover_mode")
    .setDescription("Conditions for a queue to be covered")
    .addChoices(
      choice("normal"),
      choice("1L"),
      choice("2L"),
      choice("3L"),
      choice("4L"),
      choice("1L or PC", "1L-or-pc"),
      choice("2L or PC", "2L-or-pc"),
      choice("3L or PC", "3L-or-pc"),
      choice("4L or PC", "4L-or-pc"),
      choice("tetris"),
      choice("tetris end", "tetris-end"),
      choice("tsm"),
      choice("tss"),
      choice("tsd"),
      choice("tst")
    )
    .setRequired(false);
}

export function a_piece(c: SlashCommandStringOption): SlashCommandStringOption {
  return c
    .setName("piece")
    .setDescription("A type of mino")
    .setChoices(
      choice("I"),
      choice("J"),
      choice("O"),
      choice("L"),
      choice("Z"),
      choice("S"),
      choice("T")
    );
}

export function a_color(c: SlashCommandStringOption): SlashCommandStringOption {
  return c
    .setName("color")
    .setDescription("A type of mino.")
    .setChoices(
      choice("I"),
      choice("J"),
      choice("O"),
      choice("L"),
      choice("Z"),
      choice("S"),
      choice("T"),
      choice("All colored minos", "colored"),
      choice("All minos", "all"),
      choice("Garbage", "garbage")
    );
}
