// @ts-nocheck
import fs from "fs";

import { decoder, encoder } from "tetris-fumen";
// import neodoc from "neodoc";

import { csvToPatterns, patternsToGraph, findMinimalNodes } from ".";
// import { prompt } from "./lib/fumen-prompt";

const FUMEN_SVG_SERVER = "https://fumen-svg-server.pages.dev/";

export async function main(
  filename: string
): Promise<{
  filename: any;
  solutions: Array<{ fumen: string; patterns: Array<string> }>;
  patternCount: any;
  successCount: any;
}> {
  const data = fs.readFileSync(filename, "utf8");
  let ignoreData;
  try {
    ignoreData = fs.readFileSync(".sfinder-minimal-ignore", "utf8");
  } catch (err) {
    // pass
  }
  const ignoreFumens = ignoreData
    ? new Set(
        ignoreData
          .split(/\n/)
          .map((s) => s.trim())
          .filter(Boolean)
          .filter((s) => !s.startsWith("#"))
      )
    : null;

  const startTime = Date.now();

  const patterns = csvToPatterns(data);
  const successPatterns = patterns.filter((p) => p.solutionCount);
  

  if (ignoreFumens) {
    
    for (const pattern of successPatterns) {
      pattern.fumens = pattern.fumens.filter((f) => !ignoreFumens.has(f));
    }
  }

  const { edges, nodes } = patternsToGraph(successPatterns);
  

  const { count, sets } = findMinimalNodes(edges);
  

  
  //   `You must learn ${count} solutions to cover all patterns. There are ${sets.length} combinations of solutions to cover all patterns.`
  // );

  const solutionMap = new Map();
  for (const pattern of patterns) {
    for (const fumen of pattern.fumens) {
      let sol = solutionMap.get(fumen);
      if (!sol) {
        sol = {
          fumen,
          patterns: [],
        };
        solutionMap.set(fumen, sol);
      }
      sol.patterns.push(pattern.pattern);
    }
  }

  const set = await findBestSet(sets);

  const solutions = set.map((n) => {
    const sol = solutionMap.get(n.key);
    const alters = n.alter.map((n) => solutionMap.get(n.key));
    return {
      fumen: sol.fumen,
      patterns: sol.patterns,
      alters,
    };
  });
  solutions.sort((a, b) => b.patterns.length - a.patterns.length);
  return output({
    filename: "path_minimal_strict.md",
    solutions,
    patternCount: patterns.length,
    successCount: successPatterns.length,
  });
}

async function findBestSet(sets) {
  while (sets.length > 1) {
    
    // find common nodes?
    const diffA = new Set();
    const diffB = new Set(sets[1]);
    for (const node of sets[0]) {
      if (diffB.has(node)) {
        diffB.delete(node);
      } else {
        diffA.add(node);
      }
    }

    const result = [diffA, diffB].map((s) => [...s].map((n) => n.key))[0];

    const dropNodes = result ? diffA : diffB;
    sets = sets.filter((s) => s.every((n) => !dropNodes.has(n)));
  }
  return sets[0];
}

function output({ filename, solutions, patternCount, successCount }) {
  return { filename, solutions, patternCount, successCount };
}

function fumenJoin(fumens) {
  return encoder.encode(fumens.map(decoder.decode).flat());
}
