import { SplitAsciiWhitespace } from './split_ascii_whitespace.js';
import { Lumen } from '../lumen.js';
import { Client, Guild, GuildMember, Message, MessagePayload, MessageReplyOptions, User } from 'discord.js';
import { GuildConfig } from '../model.js';

export class Ctxt {
    public constructor(private readonly _l: Lumen, private _v: Message, private _c: GuildConfig) { }

    public lumen(): Lumen {
        return this._l;
    }

    public client(): Client {
        return this.lumen().client;
    }

    public isMessage(): boolean {
        return this._v instanceof Message;
    }

    public config(): GuildConfig {
        return this._c;
    }

    public async reply(content: string | MessagePayload | MessageReplyOptions): Promise<Message<boolean>> {
        return await this._v.reply(content);
    }

    public async getUser(id: string): Promise<User | undefined> {
        try {
            return await this.client().users.fetch(id.replace(/\D/g, ''));
        } catch { }
    }

    public async getMember(id: string): Promise<GuildMember | undefined> {
        try {
            return await this.guild().members.fetch(id.replace(/\D/g, ''));
        } catch { }
    }

    public message(): Message {
        if (!this.isMessage()) { throw new Error('called `.message()` on interaction Ctxt'); }
        return this._v;
    }

    public user(): User {
        return this.message().author;
    }

    public userId(): string {
        return this.message().author.id;
    }

    public guildId(): string {
        return this.guild().id;
    }

    public guild(): Guild {
        return this.message().guild!;
    }
}

export class ParseCtxt {
    public constructor(public input: SplitAsciiWhitespace, public source: Ctxt) { }

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