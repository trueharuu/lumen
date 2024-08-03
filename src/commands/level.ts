import { Optional, UserArg } from '../parser/builtin.js';
import { command } from '../parser/command.js';

export const LevelCommand = command({
  parsers: { user: Optional(UserArg) },
  meta: {
    name: 'level'
  },
  async execute(ctx, args) {
    const target = args.user || ctx.user();
    const level = ctx.lumen().getUserLevel(target.id);
    return void (await ctx.reply_fmt(
      target.id === ctx.userId()
        ? ctx.messages.utility.level_self
        : ctx.messages.utility.level_other,
      { level: level.toString(), target_id: target.id }
    ));
  }
});
