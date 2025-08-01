import {
  ApplicationCommandRegistry,
  Awaitable,
  ChatInputCommand,
  Command,
} from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";

export interface Setup {
  seq: string;
  name: string;
  scores: number;
  queues: Array<string>;
}

export class SetScoreCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override async registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Promise<void> {
    registry.registerChatInputCommand((b) =>
      b
        .setName("set_score")
        .setDescription(
          "Returns the average score of a set, along with the coverage of each element in the set"
        )
        .addAttachmentOption((b) =>
          b.setName("csv").setDescription("The set to use").setRequired(true)
        )
    );
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.RunContext
  ): Promise<void> {
    await interaction.deferReply();
    const csv = interaction.options.getAttachment("csv", true);
    const req = await fetch(csv.url);
    const txt = await req.text();
    
    await interaction.editReply(this.set_score(txt));
  }

  public set_score(csv: string): string {
    
    const set = this.parse(csv);
    

    const cover: Map<Setup, number> = new Map();
    const no_setup: Setup = {
      name: "(no setup)",
      seq: "?",
      queues: [],
      scores: 0,
    };

    for (const q of set.total_queues) {
      
      const matches = set.setups.filter((x) => x.queues.includes(q));
      
      const optimal = this.max_by(matches, (t) => t.scores) || no_setup;
      //   console.log(q, "is", optimal.name);
      if (!cover.has(optimal)) {
        cover.set(optimal, 0);
      }

      cover.set(optimal, cover.get(optimal)! + 1);
    }

    let txt = "\u{E007E}\n";
    for (const [setup, frequency] of cover) {
      txt += `${setup.name} (\`${setup.seq}\`): ${frequency}/${set.total_queues.length} (${((100 * frequency) / set.total_queues.length).toFixed(2)}%)\n`;
    }

    const avg = cover
      .entries()
      .toArray()
      .sort((x, y) => y[1] - x[1])
      .map(([x, y]) => (x.scores * y) / set.total_queues.length)
      .reduce((p, v) => p + v, 0);

    txt += `\nOn average, this set scores __${avg.toFixed(2)}__ points.`;

    
    return txt;
  }

  public parse(csv: string) {
    const setups: Array<Setup> = [];
    const lines = csv.split("\n").filter((x) => x.trim() !== "");
    const seqs = lines[0].split(",").map((x) => x.trim());
    const comments = lines[1].split(",").map((x) => x.trim());
    const score = lines[2].split(",").map((x) => x.trim());
    const total_queues = lines.slice(3).map((x) => x.split(",")[0]);
    
    for (let i = 1; i < seqs.length; i++) {
      const seq = seqs[i];
      const name = comments[i];
      const scores = Number(score[i]);
      const queues = [];
      for (let j = 3; j < lines.length; j++) {
        if (lines[j].split(",")[i]?.trim() === "O") {
          queues.push(lines[j].split(",")[0]);
        }
      }
      setups.push({ seq, name, scores, queues });
    }

    return { setups, total_queues };
  }

  public permutations<T>(a: Array<T>, n: number): Array<Array<T>> {
    if (n === 0) return [[]];
    if (n > a.length) return [];

    const result: Array<Array<T>> = [];

    function bt(p: Array<T>, u: Array<boolean>) {
      if (p.length === n) {
        result.push([...p]);
        return;
      }

      for (let i = 0; i < a.length; i++) {
        if (u[i]) continue;
        u[i] = true;
        p.push(a[i]);
        bt(p, u);
        p.pop();
        u[i] = false;
      }
    }

    bt([], Array(a.length).fill(false));
    return result;
  }

  public max_by<T>(t: Array<T>, f: (t: T) => number): T | undefined {
    if (t.length === 0) {
      return undefined;
    }

    return t.reduce((p, v) => {
      if (f(v) > f(p)) {
        return v;
      }
      return p;
    });
  }
}
