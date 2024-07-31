import { GuildMember, User } from 'discord.js';
import { Argument } from './argument.js';
import { ParseCtxt } from './ctxt.js';

export const Word: Argument<string> = {
    async parse(ctxt: ParseCtxt): Promise<string> {
        return ctxt.next_word_panicking();
    }
};

export const UserArg: Argument<User> = {
    async parse(ctxt: ParseCtxt): Promise<User> {
        const v = ctxt.next_word_panicking();
        const u = await ctxt.source.getUser(v);

        if (u === undefined) {
            throw new Error('no user was found');
        }

        return u;
    }
};

export const GuildMemberArg: Argument<GuildMember> = {
    async parse(ctxt: ParseCtxt): Promise<GuildMember> {
        const v = ctxt.next_word_panicking();
        const u = await ctxt.source.getMember(v);

        if (u === undefined) {
            throw new Error('no guild member was found');
        }

        return u;
    }
};

export function Optional<T>(t: Argument<T>) {
    return {
        async parse(ctxt: ParseCtxt): Promise<T | undefined> {
            const fork = ctxt.fork();
            try {
                const v = await t.parse(fork);
                ctxt.sync(fork);
                return v;
            } catch { }
        }
    };
}
