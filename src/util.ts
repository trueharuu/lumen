import {
  APIApplicationCommandOptionChoice,
  Collection,
  Interaction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  Message,
} from "discord.js";
import { execSync, SpawnSyncReturns } from "node:child_process";
import { tracing } from "./tracing";

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

import * as fs from "node:fs/promises";
import path from "node:path";
import { readdirSync } from "node:fs";

export function thread_root() {
  return `${process.cwd()}/thread`;
}

export function lib_root() {
  return `${process.cwd()}/lib`;
}

export function instance(i: Interaction): string {
  return `${thread_root()}/${i.user.id}/${i.id}`;
}

export function ty_assert<T>(t: unknown): asserts t is T { }

export interface SfinderResult {
  ok: boolean;
  text: string;
}

export async function spawn(i: Interaction): Promise<string> {
  const ui = instance(i);
  await fs.mkdir(ui, { recursive: true });
  return ui;
}

export async function exec(i: Interaction, t: string): Promise<string> {
  // escape for sh
  t = t.replace(/[\\\'\"\<\>\|\;\&\|\*\(\)\[\]\?\$\#]/g, ($) => "\\" + $);
  const ui = await spawn(i);
  tracing.warn(`\x1b[34m${i.user.username}\x1b[0m (${i.user.id}, ${i.id}) ran \x1b[33m${t}\x1b[0m`);
  await fs.writeFile(ui + "/command", serialized(i) + "\n" + t);
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

export async function sfinder(i: Interaction, command: string): Promise<SfinderResult> {
  try {
    const result = await exec(i, `java -jar ${lib_root()}/sfinder.jar ${command}`);
    return { ok: true, text: result };
  } catch (e) {
    ty_assert<Error & SpawnSyncReturns<string>>(e);
    return { ok: false, text: e.stderr || e.message };
  }
}

export async function clean(i: Interaction) {
  try {
    await fs.rm(instance(i), { recursive: true });
  } catch { }
}

export function kick_tables(): Array<
  APIApplicationCommandOptionChoice<string>
> {
  const list = readdirSync(`${lib_root()}/kicks`);

  return list.map((x) => ({
    name: path.basename(x, path.extname(x)),
    value: kick_table(path.basename(x, path.extname(x))),
  }));
}

export function kick_table(s: string): string {
  return `${lib_root()}/kicks/${s}.kick`;
}

export function theme(s: string): string {
  return `${lib_root()}/theme/${s}.theme`;
}

export async function fumens_in(message: Message | string): Promise<Array<string>> {
  if (typeof message === "string") {
    message = { content: message, attachments: new Collection() } as Message;
  }

  const r = /\w\d+@[A-Za-z0-9+/?]+/g;
  const fumens: Array<string> = message.content.match(r) || [];
  for (const att of message.attachments.values()) {
    // console.log(att);
    if (att.contentType?.split(';').map(x => x.trim()).includes("text/plain")) {
      const z = att.url;
      const p = await fetch(z);
      const t = await p.text();
      const afumens = t.match(r) || [];
      for (const x of afumens) {
        fumens.push(x);
      }
    }
  }
  // console.log(fumens);
  return fumens;
}

export async function render<T, U>(
  message: Message,
  f: (t: T) => Promise<U>,
  silent: boolean = true
): Promise<U | undefined> {
  // console.log(message);
  const fumens = await fumens_in(message);
  // console.log();
  {
    const tu = /https?:\/\/tinyurl.com\/(.+?)(\s|$)/g;
    const tinyurls = message.content.match(tu) || [];

    for (const url of tinyurls) {
      const req = await fetch(url, { redirect: "manual" });
      //   console.log(req.headers);
      if (req.status === 301) {
        const actual = req.headers.get("Location")!;
        for (const z of await fumens_in(actual)) {
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
    content: z.length > 1950 ? '\u{E007E}' : `\u{E007E}[fumen.zui.jp](<https://fumen.zui.jp/?${z}#english.js>)`,
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
