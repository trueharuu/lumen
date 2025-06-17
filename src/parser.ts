import * as fs from "node:fs";
import { instance } from "./util";
export function p_path(uid: string, iid: string): string {
  const t = fs.readFileSync(
    instance(uid, iid) + "/output/path_unique.html",
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

export function p_cover(uid: string, iid: string): string {
  const t = fs.readFileSync(instance(uid, iid) + "/output/cover.csv", "utf-8");
  const csv = t.split("\n").map((x) =>
    x
      .trim()
      .split(",")
      .map((x) => x.trim())
  );
  const total_qs = csv.slice(1).length;
  const m: Map<string, Array<string>> = new Map();
  for (let i = 1; i < csv[0].length; i++) {
    const setup = csv[0][i];
    const qs = [];
    for (let j = 1; j < csv.length; j++) {
      // console.log(inspect(csv[j][i]));
      if (csv[j][i] === "O") {
        qs.push(csv[j][0]);
      }
    }

    m.set(setup, qs);
  }

  let txt = "\u{E007E}\n";
  let i = 1;

  for (const [key, value] of m) {
    txt += `\`${key}\`: ${value.length}/${total_qs} (${((value.length / total_qs) * 100).toFixed(2)}%)\n`;
  }

  const pa = Pand(
    m
      .values()
      .toArray()
      .map((x) => P(x.length, total_qs))
  );
  const po = Por(
    m
      .values()
      .toArray()
      .map((x) => P(x.length, total_qs))
  );
  txt += `\nFor __any__ setup to be made: ${Math.floor(po * total_qs)}/${total_qs} (${(100 * po).toFixed(2)}%)\n`;
  txt += `For __every__ setup to be made: ${Math.floor(pa * total_qs)}/${total_qs} (${(100 * pa).toFixed(2)}%)`;

  //   console.log(m);
  return txt;
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

export function p_ren(uid: string, iid: string): string {
  const t = fs.readFileSync(instance(uid, iid) + "/output/ren.html", "utf-8");
  const l = links(t).find((x) => !x.href.startsWith("#"));

  if (l) {
    return fumen_uri(l.href);
  }

  return "Nothing was found";
}

export function p_percent(uid: string, iid: string): string {
  const t = fs.readFileSync(
    instance(uid, iid) + "/output/last_output.txt",
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

export function p_setup(uid: string, iid: string): string {
  const t = fs.readFileSync(
    instance(uid, iid) + "/output/setup.html",
    "utf-8"
  );
  const l = links(t);
  console.log(t);
  const v = l.find((x) => x.text === "All solutions");

  if (v) {
    return fumen_uri(v.href);
  }

  return "Nothing was found";
}