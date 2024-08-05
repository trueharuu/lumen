import {
  ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  AttachmentPayload,
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  IntentsBitField,
  Interaction,
  Message,
} from 'discord.js';

import { ArgTy } from './parser/argument.js';
import { Config, GuildConfig, GuildData } from './model.js';
import { Ctxt, ParseCtxt } from './parser/ctxt.js';

import * as fs from 'node:fs';
import { parse, stringify } from '@iarna/toml';
import { deepAssign } from './common.js';
import { Command } from './parser/command.js';
import { SplitAsciiWhitespace } from './parser/split_ascii_whitespace.js';
import { fmt } from './localization/fmt.js';
import { STRINGS } from './localization/strings.js';

export class Lumen {
  public commands: Array<Command<ArgTy>> = [];
  public readonly client: Client;
  private readonly config_dir: string = 'config';
  private readonly data_dir: string = 'data';
  public constructor(public readonly config: Config) {
    this.client = new Client({
      intents: [
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
      ],
      allowedMentions: { repliedUser: false, roles: [], users: [] },
    });
  }

  public id(): string {
    return this.client.application!.id;
  }

  public defaultConfig(): GuildConfig {
    return parse(
      fs.readFileSync(`${this.config_dir}/default.toml`, 'utf-8'),
    ) as never;
  }

  public getConfig(guild_id: string): GuildConfig {
    try {
      return deepAssign(
        {},
        this.defaultConfig(),
        parse(
          fs.readFileSync(`${this.config_dir}/${guild_id}.toml`, 'utf-8'),
        ) as never,
      ) as never;
    } catch {
      return this.defaultConfig();
    }
  }

  public getGuildData(guild_id: string): GuildData {
    try {
      return parse(
        fs.readFileSync(`${this.data_dir}/${guild_id}.toml`, 'utf-8'),
      ) as never;
    } catch {
      return this.defaultGuildData(guild_id);
    }
  }

  public setGuildData(guild_id: string, data: GuildData): void {
    fs.writeFileSync(
      `${this.data_dir}/${guild_id}.toml`,
      stringify(data as never),
    );
  }

  public defaultGuildData(guild_id: string): GuildData {
    return { id: guild_id };
  }

  public getPrefixes(guild_id: string): Array<string> {
    const cfg = this.getConfig(guild_id);
    const pref = [];
    if (cfg.allow_mention_prefix) {
      pref.push(`<@${this.id()}>`, `<@!${this.id()}>`);
    }
    pref.push(...cfg.prefixes);

    return pref;
  }

  public getUserLevel(user_id: string, guild_id?: string): number {
    const matches = [0];
    if (this.config.admins.includes(user_id)) {
      matches.push(1000);
    }

    if (guild_id !== undefined) {
      const config = this.getConfig(guild_id);

      const guild = this.client.guilds.cache.get(guild_id);
      if (guild) {
        const member = guild.members.cache.get(user_id);
        if (member) {
          if (user_id in config.levels) {
            matches.push(config.levels[user_id]);
          }
          for (const [id] of guild.roles.cache) {
            if (id in config.levels && member.roles.cache.has(id)) {
              matches.push(config.levels[id]);
            }
          }
        }
      }
    }

    if (matches.includes(-1)) {
      return -1;
    }

    return Math.max(...matches);
  }

  public parseMessagePrefix(message: Message<true>): [string, string] | null {
    const found = this.getPrefixes(message.guildId).find(x =>
      message.content.startsWith(x),
    );
    if (found !== undefined) {
      return [found, message.content.slice(found.length).trim()];
    } else {
      return null;
    }
  }

  public async start() {
    this.client.on('messageCreate', (c) => {
      void this.onMessageCreate(c);
    });
    this.client.on('interactionCreate', (c) => {
      void this.onInteractionCreate(c);
    });
    this.client.on('ready', c => this.onReady(c));
    await this.client.login(this.config.token);

    for (const [id] of await this.client.guilds.fetch()) {
      const cfg = this.getConfig(id);
      const guild = this.client.guilds.cache.get(id)!;
      if (cfg.plugins.commands.enabled && cfg.plugins.commands.interactions) {
        const list: Array<ChatInputApplicationCommandData> = [];
        const groups: Map<string, Array<Command<ArgTy>>> = new Map();
        for (const cmd of this.commands) {
          if (!(cmd.register || (() => {}))(this, cfg)) {
            continue;
          }
          const ls = cmd.meta.name.split(' ');
          if (ls.length === 2) {
            const [group] = ls;
            groups.set(group, [...(groups.get(group) || []), cmd]);
          } else {
            list.push({
              name: cmd.meta.name,
              type: ApplicationCommandType.ChatInput,
              description: cmd.meta.description || '...',
              options: this.makeOptions(cmd),
            });
          }
        }

        for (const [group, vs] of groups) {
          list.push({
            name: group,
            type: ApplicationCommandType.ChatInput,
            description: '...',
            options: vs.map(x => ({
              name: x.meta.name.split(' ')[1],
              description: x.meta.description || '...',
              type: ApplicationCommandOptionType.Subcommand,
              options: this.makeOptions(x),
            })) as ReadonlyArray<ApplicationCommandOptionData>,
          });
        }

        void await guild.commands.set(list);
      }
    }
  }

  public makeOptions<T extends ArgTy>(command: Command<T>): Array<ApplicationCommandOptionData> {
    return Object.entries(command.parsers).map(([name, arg]) => arg.to_option(name, '...'));
  }

  public commandMap(): Array<[string, Command<ArgTy>]> {
    const v: Array<[string, Command<ArgTy>]> = [];
    for (const c of this.commands) {
      for (const n of [c.meta.name, ...(c.meta.aliases || [])]) {
        v.push([n, c]);
      }
    }
    v.sort((a, b) => (a[0].length < b[0].length ? 1 : -1));
    return v;
  }

  public async onMessageCreate(message: Message) {
    if (message.author.bot || !message.inGuild()) {
      return;
    }

    if (message.guild.ownerId === message.member!.id) {
      if (
        message.content === `${this.config.config_prefix}config upload`
        && message.attachments.size > 0
      ) {
        const req = await fetch(message.attachments.first()!.url);
        const data = await req.text();
        const uploaded = parse(data) as never as GuildConfig;
        await fs.promises.writeFile(
          `${this.config_dir}/${message.guild.id}.toml`,
          data,
        );

        return void (await message.reply(
          fmt(STRINGS.config.uploaded, {
            prefixes: uploaded.prefixes.map(x => `\`${x}\``).join(', '),
          }),
        ));
      }

      if (message.content === `${this.config.config_prefix}config reset`) {
        await fs.promises.rm(`${this.config_dir}/${message.guild.id}.toml`);
        return void (await message.reply(
          fmt(STRINGS.config.reset, {}),
        ));
      }

      if (message.content === `${this.config.config_prefix}config get`) {
        try {
          const data = await fs.promises.readFile(
            `${this.config_dir}/${message.guild.id}.toml`,
            'utf-8',
          );
          return void (await message.reply({
            files: [
              {
                attachment: Buffer.from(data, 'utf-8'),
                name: 'config.toml',
              } as AttachmentPayload,
            ],
          }));
        } catch {
          const data = await fs.promises.readFile(
            `${this.config_dir}/default.toml`,
            'utf-8',
          );
          return void (await message.reply({
            content: fmt(STRINGS.config.no_config, {}),
            files: [
              {
                attachment: Buffer.from(data, 'utf-8'),
                name: 'config_default.toml',
              } as AttachmentPayload,
            ],
          }));
        }
      }
    }

    const vs = this.parseMessagePrefix(message);
    if (vs === null) {
      return;
    }

    const cfg = this.getConfig(message.guildId);
    if (!cfg.plugins.commands.enabled || !cfg.plugins.commands.prefixed) {
      return;
    }

    const [, vecs] = vs;
    void await this.takeCommand(vecs, message, cfg);
  }

  public async takeCommand(vecs: string, item: Message | ChatInputCommandInteraction, cfg: GuildConfig) {
    for (const [name, command] of this.commandMap()) {
      const ctxt = new Ctxt(this, item);
      if (vecs.startsWith(name)) {
        const argl = vecs.slice(name.length).trim();
        try {
          const should = await (command.register || (async () => true))(this, cfg);
          if (!should) {
            return;
          }
        } catch {
          return;
        }

        try {
          const check = await (command.check || (async () => true))(ctxt);
          if (!check) {
            return await ctxt.reply(
              fmt(STRINGS.commands.not_allowed, {}),
            );
          }
        } catch (e) {
          return await ctxt.reply(
            fmt(STRINGS.commands.preprocessing_error, { message: (e as Error).message || (e as string) }),
          );
        }

        try {
          const argv = [] as never[];
          const pctx = new ParseCtxt(new SplitAsciiWhitespace(argl), ctxt);
          const parsers = Object.entries(command.parsers);
          for (const [k, parser] of parsers) {
            try {
              argv.push([k, (await parser.parse(pctx))] as never);
            } catch (e) {
              return await ctxt.reply(
                fmt(STRINGS.commands.parsing_error, { message: (e as Error).message || (e as string) }),
              );
            }
          }
          await command.execute(ctxt, Object.fromEntries(argv));
        } catch (e) {
          return await ctxt.reply(
            fmt(STRINGS.commands.execution_error, { message: (e as Error).message || (e as string) }),
          );
        }
        break;
      }
    }
  }

  public onReady(client: Client) {
    void client;
  }

  public async onInteractionCreate(c: Interaction) {
    if (!c.isChatInputCommand()) {
      return;
    }

    const sub = c.options.getSubcommand(false);
    const name = sub ? `${c.commandName} ${sub}` : c.commandName;
    const [, cmd] = this.commandMap().find(([n]) => n === name)!;
    const argv: Record<string, unknown> = {};
    const ctxt = new Ctxt(this, c);

    for (const [key, parser] of Object.entries(cmd.parsers)) {
      argv[key] = await parser.parse_option(ctxt, key);
    }

    void await cmd.execute(ctxt, argv);
  }

  public register<T extends ArgTy>(command: Command<T>) {
    this.commands.push(command);
  }

  public event<Event extends keyof ClientEvents>(
    event: Event,
    listener: (...args: ClientEvents[Event]) => unknown,
  ) {
    this.client.on(event, listener);
  }
}
