import {
  APIApplicationCommandOptionChoice,
  Interaction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
} from "discord.js";
import { execSync, SpawnSyncReturns } from "node:child_process";

export function respond_lengthy(
  start: string,
  t: string,
  cb: boolean = true
): InteractionEditReplyOptions {
  if (t.length >= 1990 - start.length) {
    return {
      content: start,
      files: [{ name: "response.txt", attachment: Buffer.from(t) }],
    };
  }

  return { content: `${start} ${cb ? "```\n" : ""}${t}${cb ? "\n```" : ""}` };
}

import * as fs from "node:fs";
import path from "node:path";

export function thread_root() {
  return `${process.cwd()}\\thread`;
}

export function lib_root() {
  return `${process.cwd()}\\lib`;
}

export function instance(i: Interaction): string {
  return `${thread_root()}\\${i.user.id}\\${i.id}`;
}

export function ty_assert<T>(t: unknown): asserts t is T {}

export interface SfinderResult {
  ok: boolean;
  text: string;
}

export function spawn(i: Interaction): string {
  const ui = instance(i);
  fs.mkdirSync(ui, { recursive: true });
  return ui;
}

export function exec(i: Interaction, t: string) {
  t = t.replace(/[\&\|\<\>\(\)\^]/g, ($) => "^" + $);
  const ui = spawn(i);
  fs.writeFileSync(ui + "/command", serialized(i) + "\n" + t);
  return execSync(t, { encoding: "utf-8", cwd: ui });
}

export function serialized(i: Interaction) {
  if (i.isChatInputCommand()) {
    const opts = i.options.data
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .map((x) => `[${x.name}: ${x.value?.toString()}]`)
      .join(" ");
    return `/${i.commandName} ${opts}`;
  }

  if (i.isContextMenuCommand()) {
    return `Context Menu > ${i.commandName}`;
  }

  return i.id;
}

export function sfinder(i: Interaction, command: string): SfinderResult {
  try {
    const result = exec(i, `java -jar ${lib_root()}\\sfinder.jar ${command}`);
    return { ok: true, text: result };
  } catch (e) {
    ty_assert<Error & SpawnSyncReturns<string>>(e);
    return { ok: false, text: e.stderr || e.message };
  }
}

export function clean(i: Interaction) {
  fs.rmSync(instance(i), { recursive: true });
}

export function kick_tables(): Array<
  APIApplicationCommandOptionChoice<string>
> {
  const list = fs.readdirSync(`${lib_root()}\\kicks`);

  return list.map((x) => ({
    name: path.basename(x, path.extname(x)),
    value: kick_table(path.basename(x, path.extname(x))),
  }));
}

export function kick_table(s: string): string {
  return `${lib_root()}\\kicks\\${s}.kick`;
}

export function theme(s: string): string {
  return `${lib_root()}\\theme\\${s}.theme`;
}

export function fumens_in(t: string): Array<string> {
  const r = /\w\d+@[A-Za-z0-9+/?]+/g;
  const fumens = t.match(r) || [];
  // console.log(fumens);
  return fumens;
}

export async function render<T, U>(
  content: string,
  f: (t: T) => Promise<U>,
  silent: boolean = true
): Promise<U | undefined> {
  const fumens = fumens_in(content);
  {
    const tu = /https?:\/\/tinyurl.com\/(.+?)(\s|$)/g;
    const tinyurls = content.match(tu) || [];

    for (const url of tinyurls) {
      const req = await fetch(url, { redirect: "manual" });
      //   console.log(req.headers);
      if (req.status === 301) {
        const actual = req.headers.get("Location")!;
        for (const z of fumens_in(actual)) {
          fumens.push(z);
        }
      }
    }
  }

  if (fumens.length === 0) {
    if (silent) {
      return;
    }

    return await f({
      content: ":warning: No fumens to render.",
      flags: ["Ephemeral"],
      allowedMentions: { repliedUser: false },
    } as T);
  }

  const z = fumens[0]!;
  const req = await fetch(
    `https://qv.rqft.workers.dev/fumen?data=${encodeURIComponent(z)}`
  );
  const img = await req.arrayBuffer();

  return await f({
    content: `\u{E007E}[fumen.zui.jp](<https://fumen.zui.jp/?${z}>)`,
    files: [{ name: "fumen.gif", attachment: Buffer.from(img) }],
    allowedMentions: { repliedUser: false },
  } as T);
}

export function subsets<T>(t: Array<T>): Array<Array<T>> {
  return Array(2 ** t.length)
    .fill(0)
    .map((_, i) => i)
    .map((m) => t.filter((_, i) => ((1 << i) & m) !== 0));
}

export function* permutations<T>(t: Iterable<T>, n: number): Generator<T[]> {
  const items = Array.from(t);
  const current: T[] = [];

  function* backtrack(depth: number): Generator<T[]> {
    if (depth === n) {
      yield [...current];
      return;
    }
    for (const item of items) {
      current.push(item);
      yield* backtrack(depth + 1);
      current.pop();
    }
  }

  yield* backtrack(0);
}
