import * as fs from "node:fs/promises";
import { instance, subsets } from "./util";
import { decode } from "tetris-fumen/lib/decoder";
import { encode } from "tetris-fumen/lib/encoder";
import { EncodePages } from "tetris-fumen";
export async function p_path(interaction: Interaction): Promise<string> {
  const t = await fs.readFile(
    instance(interaction) + "/output/path_unique.html",
    "utf-8"
  );
  const l = links(t);
  const v = l.find((x) => x.text === "All solutions");

  if (v) {
    return fumen_uri(v.href);
  }

  return "Nothing was found";
}

export interface AnchorElement {
  text: string;
  href: string;
}

export function links(t: string): Array<AnchorElement> {
  const f = /<a href=['"](.+?)['"].*?>(.*?)<\/a>/g;
  const ex = t.match(f);
  if (ex === null) {
    return [];
  }

  return ex.map((x) => {
    // yeah, fuck your optimizations
    // lets just compile the same regex on every loop
    const r = /<a href=['"](.+?)['"].*?>(.*?)<\/a>/g;
    const [, href, text] = r.exec(x)!;
    return { href, text };
  });
}

export function cover_setups(t: string): {
  total: Set<string>;
  setups: Map<string, string[]>;
} {
  const csv = t
    .split("\n")
    .filter((x) => x.trim() !== "")
    .map((x) =>
      x
        .trim()
        .split(",")
        .map((x) => x.trim())
    );
  const total = new Set(csv.slice(1).map((x) => x[0]));
  const setups: Map<string, Array<string>> = new Map();
  for (let i = 1; i < csv[0].length; i++) {
    const setup = csv[0][i];
    const qs = [];
    for (let j = 1; j < csv.length; j++) {

      if (csv[j][i] === "O") {
        qs.push(csv[j][0]);
      }
    }

    setups.set(setup, qs);
  }

  return { setups, total };
}

export async function p_cover(interaction: Interaction, cover_mode: string): Promise<string> {
  const t = await fs.readFile(
    instance(interaction) + "/output/cover.csv",
    "utf-8"
  );
  const { setups, total } = cover_setups(t);
  let txt = `\u{E007E}\`${cover_mode}\` cover\n`;

  for (const [key, value] of setups) {
    txt += `\`${key}\`: ${value.length}/${total.size} (${((value.length / total.size) * 100).toFixed(2)}%)\n`;
  }

  const po = total
    .values()
    .filter((x) => setups.values().some((y) => y.includes(x)))
    .toArray().length;
  const pa = total
    .values()
    .filter((x) => setups.values().every((y) => y.includes(x)))
    .toArray().length;
  txt += `\nFor __any__ setup to be made: ${po}/${total.size} (${(100 * (po / total.size)).toFixed(2)}%)`;
  txt += `\nFor __every__ setup to be made: ${pa}/${total.size} (${(100 * (pa / total.size)).toFixed(2)}%)`;

  //   console.log(m);
  return txt;
}

export async function p_cover_minimals(interaction: Interaction, cover_mode: string): Promise<string> {
  const t = await fs.readFile(
    instance(interaction) + "/output/cover.csv",
    "utf-8"
  );
  const { setups, total } = cover_setups(t);
  const sets = subsets([
    ...setups.entries().map((x) => ({ name: x[0], queues: x[1] })),
  ]);

  const target_queues = new Set(setups.values().reduce((p, v) => [...p, ...v], []));

  let minimal_set: { name: string; queues: string[] }[] | undefined;
  for (const set of sets) {
    const total_queue_set = new Set();
    for (const path of set) {
      for (const queue of path.queues) {
        total_queue_set.add(queue);
      }
    }

    if (target_queues.isSubsetOf(total_queue_set)) {
      minimal_set = set;
      break;
    }
  }

  if (minimal_set) {
    let txt = `\u{E007E}Cover mode ${cover_mode}\n`;

    for (const { name, queues } of minimal_set) {
      txt += `\`${name}\`: ${queues.length}/${total.size} (${((queues.length / total.size) * 100).toFixed(2)}%)\n`;
    }

    const po = total
      .values()
      .filter((x) => setups.values().some((y) => y.includes(x)))
      .toArray().length;
    const pa = total
      .values()
      .filter((x) => setups.values().every((y) => y.includes(x)))
      .toArray().length;
    txt += `\nFor __any__ setup to be made: ${po}/${total.size} (${(100 * (po / total.size)).toFixed(2)}%)`;
    txt += `\nFor __every__ setup to be made: ${pa}/${total.size} (${(100 * (pa / total.size)).toFixed(2)}%)`;

    //   console.log(m);
    return txt;
  }

  return "Nothing was found";
}

export function P(cover: number, max: number): number {
  return cover / max;
}

export function Pand(a: Array<number>): number {
  return a.reduce((p, v) => p * v, 1);
}

export function Por(a: Array<number>): number {
  return 1 - Pand(a.map((x) => 1 - x));
}

export function fumen_uri(t: string): string {
  return t.replace(/.+?\w(\d+)@(.+)/g, ($, $v, $d) => `v${$v}@${$d}`);
}

export async function p_ren(interaction: Interaction): Promise<string> {
  const t = await fs.readFile(
    instance(interaction) + "/output/ren.html",
    "utf-8"
  );
  const l = links(t).find((x) => !x.href.startsWith("#"));

  if (l) {
    return fumen_uri(l.href);
  }

  return "Nothing was found";
}

export async function p_percent(interaction: Interaction): Promise<string> {
  const t = await fs.readFile(
    instance(interaction) + "/output/last_output.txt",
    "utf-8"
  );
  const z = /^success = .+$/gm.exec(t);

  if (z) {
    const y = /^success = .+? \((\d+)\/(\d+)\)$/gm.exec(t);
    if (y) {
      const [, p, t] = y;
      const [pass, total] = [Number(p), Number(t)];

      return `${((100 * pass) / total).toFixed(2)}% (${pass}/${total})`;
    }
  }

  return "Nothing was found";
}

export async function p_setup(interaction: Interaction): Promise<string | null> {
  const t = await fs.readFile(
    instance(interaction) + "/output/setup.html",
    "utf-8"
  );
  const l = links(t);

  const v = l.find((x) => x.text === "All solutions");

  if (v) {
    return fumen_uri(v.href);
  }

  return null;
}

import { main } from "./ext/minimal/cli";
import { Interaction } from "discord.js";
export async function p_minimals(interaction: Interaction): Promise<string> {
  const file =
    instance(interaction) + "/output/path.csv";
  const t = await main(file);

  const f: EncodePages = [];
  for (const min of t.solutions) {
    const z = decode(min.fumen);
    const n = min.patterns.length;
    const d = t.successCount;
    f.push({
      field: z[0].field,
      flags: z[0].flags,
      operation: z[0].operation,
      comment: `${((100 * n) / d).toFixed(2)}% (${n}/${d})`,
    });
  }

  return "v115@" + encode(f);

  // return "?";
}

export function join_fumens(t: Array<string>): string {
  const p: EncodePages = [];

  for (const m of t) {
    const d = decode(m);
    for (const page of d) {
      p.push(page);
    }
  }

  return "v115@" + encode(p);
}

export async function p_spin(interaction: Interaction, verbose: boolean): Promise<string> {
  const t = await fs.readFile(
    instance(interaction) + "/output/spin.csv",
    "utf-8"
  );

  const lines = t.split(/\n+/).slice(1).filter((x) => x.trim() !== "").map((x) => x.trim().split(",").map((y) => y.trim())).map(x => {
    const fumen = x[0].slice('http://fumen.zui.jp/?'.length);
    const doable = x[1] === 'O';
    const used = x[2];
    // const n = x[3];
    const clear = Number(x[4]);
    const mini = x[5] === 'O';
    const special = x[6];
    const total_clear = Number(x[7]);
    const hole = Number(x[8]);
    const t_rot = x[9];
    const t_x = Number(x[10]);
    const t_y = Number(x[11]);

    return { fumen, doable, used, clear, mini, special, total_clear, hole, t_rot, t_x, t_y };
  }).filter(x=>x.doable).map(x => {
    const d = decode(x.fumen);
    // append info to comment
    if (verbose) {
      d[0].comment = `TS${x.mini ? 'M' : ''}${clearcount[x.clear]}${x.special !== '' ? ' ' + x.special : ''} ${x.used} [${x.t_x},${x.t_y},${rots[x.t_rot as keyof typeof rots]}] ${x.hole}H${x.total_clear}C`;
    } else {
      d[0].comment = `TS${x.mini ? 'M' : ''}${clearcount[x.clear]}${x.special !== '' ? ' '+x.special : ''}`;
    }

    return d[0];
  });

  return 'v115@' + encode(lines);
}

export const clearcount = ['0', 'S', 'D', 'T'];
export const rots = { '0': 'N', 'R': 'E', '2': 'S', 'L': 'W' };