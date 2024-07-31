import { Optional, UserArg } from '../parser/builtin.js';
import { command } from '../parser/command.js';

export const LevelCommand = command({
    parsers: [Optional(UserArg)],
    meta: {
        name: 'level',
    },
    async execute(ctx, user) {
        const target = user || ctx.user();
        const level = ctx.lumen().getUserLevel(target.id);
        const noun = target.id === ctx.userId() ? 'Your' : `<@${target.id}>'s`;

        await ctx.reply(`${noun} bot level is **${level}**`);
    }
});