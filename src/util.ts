import {
  APIApplicationCommandOptionChoice,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
} from "discord.js";

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

import * as child_process from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";

export function thread_root() {
  return `${process.cwd()}\\thread`;
}

export function lib_root() {
  return `${process.cwd()}\\lib`;
}

export function instance(uid: string, iid: string): string {
  return `${thread_root()}\\${uid}\\${iid}`;
}

export function ty_assert<T>(t: unknown): asserts t is T {}

export interface SfinderResult {
  ok: boolean;
  text: string;
}
export function sfinder(
  command: string,
  uid: string,
  iid: string
): SfinderResult {
  const dir = instance(uid, iid);
  fs.mkdirSync(dir, { recursive: true });

  console.log(dir);
  console.log(command);
  try {
    const result = child_process.execSync(
      `java -jar ${lib_root()}\\sfinder.jar ${command}`,
      { encoding: "utf-8", cwd: dir }
    );
    return { ok: true, text: result };
  } catch (e) {
    ty_assert<Error & child_process.SpawnSyncReturns<string>>(e);
    return { ok: false, text: e.stderr || e.message };
  }
}

export function clean(uid: string, iid?: string) {
  if (iid) {
    fs.rmSync(instance(uid, iid), { recursive: true });
  } else {
    const d = fs.readdirSync(thread_root());
    for (const path of d) {
      if (path.startsWith(uid + "-")) {
        fs.rmSync(`${thread_root()}\\${path}`, { recursive: true });
      }
    }
  }
}

export function kick_tables(): Array<
  APIApplicationCommandOptionChoice<string>
> {
  const list = fs.readdirSync(`${lib_root()}\\kicks`);

  return list.map((x) => ({
    name: path.basename(x, path.extname(x)),
    value: kick_table(x),
  }));
}

export function kick_table(s: string): string {
  return `${lib_root()}\\kicks\\${s}.kick`;
}

export function fumenutil(command: string): string {
  return child_process
    .execSync(`py ${lib_root()}/fumenutil/main.py ${command}`)
    .toString()
    .trim();
}

export function fumens_in(t: string): Array<string> {
  const r = /\w\d+@[A-Za-z0-9+/?]+/g;
  const fumens = t.match(r) || [];
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

    // console.log(tinyurls);

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
    files: [{ name: "fumen.gif", attachment: Buffer.from(img) }],
    allowedMentions: { repliedUser: false },
  } as T);
}
