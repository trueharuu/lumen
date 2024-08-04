import { SplitAsciiWhitespace } from './split_ascii_whitespace.js';
import { Lumen } from '../lumen.js';
import {
  APIEmbed,
  ChatInputCommandInteraction,
  Client,
  Guild,
  GuildMember,
  JSONEncodable,
  Message,
  MessagePayload,
  User,
} from 'discord.js';
import { GuildConfig, GuildData } from '../model.js';
import { fmt, Inject } from '../localization/fmt.js';
import { STRINGS } from '../localization/strings.js';
export interface CtxtReply {
  content?: string
  embeds?: Array<APIEmbed | JSONEncodable<APIEmbed>>
}
export class Ctxt {
  public constructor(
    private readonly _l: Lumen,
    private _v: Message | ChatInputCommandInteraction,
  ) {}

  public lumen(): Lumen {
    return this._l;
  }

  public client(): Client {
    return this.lumen().client;
  }

  public isMessage(): boolean {
    return this._v instanceof Message;
  }

  public isInteraction(): boolean {
    return this._v instanceof ChatInputCommandInteraction;
  }

  public config(): GuildConfig {
    return this.lumen().getConfig(this.guildId());
  }

  public data(): GuildData {
    return this.lumen().getGuildData(this.guildId());
  }

  public async reply(
    content: string | CtxtReply,
  ): Promise<Ctxt> {
    if (this._v instanceof Message) {
      void await this._v.reply(content);
    } else {
      void await this._v.reply(content);
    }

    return this;
  }

  public async reply_fmt<T extends string>(
    base: T,
    inj: Inject<T>,
    extra?: MessagePayload,
  ): Promise<Ctxt> {
    return await this.reply(
      Object.assign({}, { content: fmt(base, inj) }, extra),
    );
  }

  public get messages() {
    return STRINGS;
  }

  public async getUser(id: string): Promise<User | undefined> {
    try {
      return await this.client().users.fetch(id.replace(/\D/g, ''));
    } catch {}
  }

  public async getMember(id: string): Promise<GuildMember | undefined> {
    try {
      return await this.guild().members.fetch(id.replace(/\D/g, ''));
    } catch {}
  }

  public message(): Message<true> {
    if (!this.isMessage()) {
      throw new Error('called `.message()` on interaction Ctxt');
    }
    return this._v as never;
  }

  public interaction(): ChatInputCommandInteraction {
    if (!this.isInteraction()) {
      throw new Error('called `.interaction()` on message Ctxt');
    }

    return this._v as never;
  }

  public user(): User {
    if (this.isMessage()) {
      return this.message().author;
    } else {
      return this.interaction().user;
    }
  }

  public userId(): string {
    return this.user().id;
  }

  public guildId(): string {
    return this.guild().id;
  }

  public guild(): Guild {
    if (this.isMessage()) {
      return this.message().guild;
    } else {
      return this.interaction().guild!;
    }
  }

  public member(): GuildMember {
    if (this.isMessage()) {
      return this.message().member!;
    } else {
      return this.guild().members.cache.get(this.interaction().member!.user.id)!;
    }
  }
}

export class ParseCtxt {
  public constructor(
    public input: SplitAsciiWhitespace,
    public source: Ctxt,
  ) {}

  public next_word(): string | null {
    return this.input.next();
  }

  public next_word_panicking(): string {
    const v = this.next_word();
    if (v === null) {
      throw new Error('an argument was expected but none were found');
    }

    return v;
  }

  public rest(): string | null {
    return this.input.rest();
  }

  public commit_if_ok(f: (f: ParseCtxt) => [boolean, this]) {
    const [ok, splice] = f(this.fork());
    if (ok) {
      this.input.inner = splice.input.inner;
    }
  }

  public fork(): ParseCtxt {
    return new ParseCtxt(this.input.clone(), this.source);
  }

  public sync(v: ParseCtxt) {
    this.input.inner = v.input.inner;
  }
}
