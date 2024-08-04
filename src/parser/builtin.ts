import { ApplicationCommandOptionType, GuildMember, User } from 'discord.js';
import { Argument } from './argument.js';
import { ParseCtxt } from './ctxt.js';

export const Word: Argument<string> = {
  async parse(ctxt: ParseCtxt): Promise<string> {
    return ctxt.next_word_panicking();
  },

  async parse_option(ctxt, name) {
    return ctxt.interaction().options.getString(name, true);
  },

  to_option(name, description) {
    return { name, description, required: true, type: ApplicationCommandOptionType.String };
  },
};

export const UserArg: Argument<User> = {
  async parse(ctxt: ParseCtxt): Promise<User> {
    const v = ctxt.next_word_panicking();
    const u = await ctxt.source.getUser(v);

    if (u === undefined) {
      throw new Error('no user was found');
    }

    return u;
  },

  async parse_option(ctxt, name) {
    return ctxt.interaction().options.getUser(name, true);
  },

  to_option(name, description) {
    return { name, description, required: true, type: ApplicationCommandOptionType.User };
  },
};

export const GuildMemberArg: Argument<GuildMember> = {
  async parse(ctxt: ParseCtxt): Promise<GuildMember> {
    const v = ctxt.next_word_panicking();
    const u = await ctxt.source.getMember(v);

    if (u === undefined) {
      throw new Error('no guild member was found');
    }

    return u;
  },

  async parse_option(ctxt, name) {
    const v = await ctxt.getMember(ctxt.interaction().options.getUser(name, true).id);
    if (v === undefined) {
      throw new Error('no guild member was found');
    }

    return v;
  },

  to_option(name, description) {
    return { name, description, required: true, type: ApplicationCommandOptionType.User };
  },
};

export function Optional<T>(t: Argument<T>): Argument<T | undefined> {
  return {
    async parse(ctxt: ParseCtxt): Promise<T | undefined> {
      const fork = ctxt.fork();
      try {
        const v = await t.parse(fork);
        ctxt.sync(fork);
        return v;
      } catch { }
    },

    async parse_option(ctxt, name) {
      try {
        return await t.parse_option(ctxt, name);
      } catch {
        return undefined;
      }
    },

    to_option(name, description) {
      return { ...t.to_option(name, description), required: false };
    },
  };
}
