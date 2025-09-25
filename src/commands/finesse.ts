import {
  ApplicationCommandRegistry,
  Awaitable,
  ChatInputCommand,
  Command,
} from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import { a_kick_table, a_tetfu, choice } from "../args";
import { kick_table, lib_root, permutations, respond_lengthy } from "../util";
import { decode } from "tetris-fumen/lib/decoder";
import { Field, Operation } from "tetris-fumen/lib/field";
import {
  Input,
  Key,
  Kick,
  kicktable,
  PieceDef,
  piecetable,
  say_key,
  SpinBonuses,
} from "../engine/input";
import { readFileSync } from "fs";
import {
  parsePiece,
  parseRotation,
  Piece,
  PieceType,
} from "tetris-fumen/lib/defines";
import { encode, EncodePage } from "tetris-fumen/lib/encoder";
import { getBlockXYs } from "tetris-fumen/lib/inner_field";

export class FinesseCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Promise<void> {
    registry.registerChatInputCommand((b) =>
      b
        .setName("finesse")
        .setDescription("Returns the minimal inputs needed to place a piece.")
        .addStringOption((c) => a_tetfu(c))
        .addStringOption((c) => a_kick_table(c))
        .addIntegerOption((c) =>
          c
            .setName("inputs")
            .setDescription("Maximum amount of inputs to consider (default 6)")
            .setRequired(false)
        )
        .addStringOption((c) =>
          c
            .setName("style")
            .setDescription("Finesse style to use (default softdrop + 180)")
            .addChoices(
              choice("softdrop", "sf"),
              choice("softdrop + 180", "sf180"),
              choice("sonicdrop", "sd"),
              choice("sonicdrop + 180", "sd180")
            )
            .setRequired(false)
        )
        .addIntegerOption((c) =>
          c
            .setName("height")
            .setDescription("The assumed height of the board.")
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
    const kicks =
      interaction.options.getString("kicks", false) ?? kick_table("srs");
    const inputs = interaction.options.getInteger("inputs", false) ?? 6;
    const style = interaction.options.getString("style", false) ?? "sf180";
    const ht = interaction.options.getInteger("height", false) ?? 20;
    

    const keyboard: Array<Key> = {
      sf: [
        Key.MoveLeft,
        Key.MoveRight,
        Key.DasLeft,
        Key.DasRight,
        Key.RotateCCW,
        Key.RotateCW,
        Key.SonicDrop,
        Key.SoftDrop,
      ],
      sf180: [
        Key.MoveLeft,
        Key.MoveRight,
        Key.DasLeft,
        Key.DasRight,
        Key.RotateCCW,
        Key.RotateCW,
        Key.SonicDrop,
        Key.SoftDrop,
        Key.Rotate180,
      ],
      sd: [
        Key.MoveLeft,
        Key.MoveRight,
        Key.DasLeft,
        Key.DasRight,
        Key.RotateCCW,
        Key.RotateCW,
        Key.SonicDrop,
      ],
      sd180: [
        Key.MoveLeft,
        Key.MoveRight,
        Key.DasLeft,
        Key.DasRight,
        Key.RotateCCW,
        Key.RotateCW,
        Key.SonicDrop,
        Key.Rotate180,
      ],
    }[style]!;

    // for each page:
    // if there is an `operation` on this page, use this as the minos to consider
    // otherwise look for colored minos and test that theyre a valid placement

    //   console.log(clean, p);

    const kzt = kicktable(readFileSync(kicks, "utf-8"));
    const pzt = piecetable(
      readFileSync(lib_root() + "/pieces/tetromino.piece", "utf-8")
    );

    const fum: EncodePage[] = [];
    const track = [];
    let ml = 1;
    for (const page of decode(tetfu)) {
      let clean = page.field
        .str({ reduced: false, garbage: false, separator: "|" })
        .split("|")
        .map((x) => x.split("").map((y) => (y === "X" ? "X" : "_")));
      let p;
      const consider: Array<Operation> = [];
      if (page.operation) {
        consider.push(page.operation);
        p = page.operation.type;
      } else {
        const d = this.detect(page.field, ht, clean, kzt, pzt);
        if (d.length === 0) {
          await interaction.editReply(`Missing operation on page ${ml}`);
          return;
        } else {
          consider.push(...d);
          p = d[0].type;
        }
      }

      let shortest;
      let lx;
      let ly;
      let lr;

      for (const c of consider) {
        let t;
        a: for (let n = 0; n <= inputs; n++) {
          for (const seq of permutations(keyboard, n)) {
            const i = new Input(
              10,
              ht,
              2,
              clean,
              p!,
              kzt,
              pzt,
              SpinBonuses.AllMiniImmobile
            );

            for (const k of seq) {
              i.press(k);
            }

            const l = i.snapshot().placement;
            if (l.x === c.x && l.y === c.y && l.rotation === c.rotation) {
              
              lx = l.x;
              ly = l.y;
              lr = l.rotation;
              t = seq;
              break a;
            }
          }
        }

        if (t) {
          if (shortest === undefined || t.length < shortest.length) {
            shortest = t;
          }
        }

        
      }

      if (!shortest) {
        await interaction.editReply(
          `Could not find any finesse for page ${ml}`
        );
        return;
      }

      track.push(
        `\`${p}(${lx}, ${ly}, ${lr})\`: ${shortest.map(say_key).join(", ")}`
      );

      const i = new Input(
        10,
        ht,
        2,
        clean,
        p!,
        kzt,
        pzt,
        SpinBonuses.AllMiniImmobile
      );

      const f = Field.create(clean.map((x) => x.join("")).join(""));
      const n = i.get();
      for (const { x, y } of getBlockXYs(
        parsePiece(n.type),
        parseRotation(n.rotation),
        n.x,
        n.y
      )) {
        f.set(x, y, n.type);
      }

      fum.push({ field: f, comment: "spawn" });

      for (const key of shortest) {
        i.press(key);

        const f = Field.create(clean.map((x) => x.join("")).join(""));
        const p = i.get();
        for (const { x, y } of getBlockXYs(
          parsePiece(p.type),
          parseRotation(p.rotation),
          p.x,
          p.y
        )) {
          f.set(x, y, p.type);
        }

        fum.push({ field: f, comment: key });
      }

      ml++;
    }

    const tet = "v115@" + encode(fum);

    await interaction.editReply(
      respond_lengthy(
        "",
        `[fumen](<https://fumen.zui.jp/${tet}>)\n${track.join("\n")}`,
        false
      )
    );
  }

  public detect(
    f: Field,
    height: number,
    clean: Array<Array<PieceType>>,
    kzt: Kick[],
    pzt: PieceDef[]
  ): Array<Operation> {
    const colored: Array<[number, number, PieceType]> = [];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < height; y++) {
        const t = f.at(x, y);
        if (t !== "_" && t !== "X") {
          colored.push([x, y, t] as [number, number, PieceType]);
        }
      }
    }

    if (colored.length !== 4) {
      return [];
    }

    const ops = colored.flatMap(([x, y, t]) =>
      (["spawn", "right", "reverse", "left"] as const).map(
        (r) => ({ x, y, type: t, rotation: r }) satisfies Operation
      )
    );

    return ops.filter((x) => {
      return getBlockXYs(
        parsePiece(x.type),
        parseRotation(x.rotation),
        x.x,
        x.y
      ).every((x) => colored.some(([dx, dy]) => x.x === dx && x.y === dy));
    });
  }
}
