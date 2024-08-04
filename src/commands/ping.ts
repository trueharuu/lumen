import { command } from '../parser/command.js';

export const PingCommand = command({
  parsers: {},
  meta: {
    name: 'ping',
  },
  async execute(ctx) {
    await ctx.reply_fmt(ctx.messages.utility.pong, {
      ms: (Date.now() - ctx.message().createdTimestamp).toString(),
    });
  },
});
