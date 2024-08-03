import { EmbedBuilder, GuildMember, PartialGuildMember } from 'discord.js';
import { Lumen } from '../lumen.js';
import {
  AdminPersistPlugin,
  GuildData,
  GuildMemberPersistData
} from '../model.js';
import { GuildMemberArg, Optional, UserArg } from '../parser/builtin.js';

export function createPersistData(
  data: GuildData,
  v: PartialGuildMember | GuildMember,
  c: AdminPersistPlugin
): GuildData {
  data.persist ??= {};
  const d: GuildMemberPersistData = {};
  if (c.nickname) {
    d.nickname = v.nickname || undefined;
  }
  if (c.roles) {
    d.roles = v.roles.cache.map((v) => v.id);
  }
  if (c.voice) {
    d.deaf = v.voice.serverDeaf || false;
    d.mute = v.voice.serverMute || false;
  }

  data.persist[v.id] = d;

  return data;
}

export function adminEvents(l: Lumen) {
  l.event('guildMemberRemove', (v) => {
    const cfg = l.getConfig(v.guild.id);
    const data = l.getGuildData(v.guild.id);
    if (cfg.plugins.admin.enabled && cfg.plugins.admin.persist.enabled) {
      l.setGuildData(
        v.guild.id,
        createPersistData(data, v, cfg.plugins.admin.persist)
      );
    }
  });

  l.event('guildMemberAdd', async (v) => {
    const cfg = l.getConfig(v.guild.id);
    const data = l.getGuildData(v.guild.id);
    if (cfg.plugins.admin.enabled && cfg.plugins.admin.persist.enabled) {
      if (
        cfg.plugins.admin.persist.nickname &&
        data.persist?.[v.id].nickname !== undefined
      ) {
        await v.setNickname(data.persist[v.id].nickname || null);
      }
    }
  });
}

import { command } from '../parser/command.js';
import { chevron, embed_color } from '../common.js';

export const AdminPersistSave = command({
  parsers: { member: Optional(GuildMemberArg) },
  meta: {
    name: 'persist save'
  },

  async check(ctx) {
    return ctx.lumen().getUserLevel(ctx.userId(), ctx.guildId()) >= 50;
  },

  async register(ctx) {
    return (
      ctx.config().plugins.admin.enabled &&
      ctx.config().plugins.admin.persist.enabled
    );
  },

  async execute(ctx, args) {
    const target = args.member || ctx.member();
    const data = ctx.lumen().getGuildData(ctx.guildId());
    ctx
      .lumen()
      .setGuildData(
        ctx.guildId(),
        createPersistData(data, target, ctx.config().plugins.admin.persist)
      );
    return void (await ctx.reply_fmt(ctx.messages.admin.persist.saved_data, {
      target_id: target.id
    }));
  }
});

export const AdminPersistGet = command({
  parsers: { user: Optional(UserArg) },
  meta: { name: 'persist get' },
  async register(ctx) {
    return (
      ctx.config().plugins.admin.enabled &&
      ctx.config().plugins.admin.persist.enabled
    );
  },
  async execute(ctx, args) {
    const target = args.user || ctx.user();
    const data = ctx.lumen().getGuildData(ctx.guildId()).persist?.[target.id];
    if (data === undefined) {
      return void (await ctx.reply_fmt(
        ctx.messages.admin.persist.no_data_found,
        { target_id: target.id }
      ));
    }

    const msg = [];
    msg.push(`${chevron} Persist data for ${target.tag}`);
    if (data.nickname !== undefined) {
      msg.push(`Nickname: \`${data.nickname}\``);
    }

    if (data.roles !== undefined) {
      msg.push(`Roles: ${data.roles.map((x) => `<@${x}>`).join(', ')}`);
    }

    if (data.mute || data.deaf) {
      msg.push(
        `Voice: ${[
          data.mute ? 'Server Muted' : '',
          data.deaf ? 'Server Deafened' : ''
        ]
          .filter((x) => x !== '')
          .join(', ')}`
      );
    }

    return void (await ctx.reply({
      embeds: [
        new EmbedBuilder().setDescription(msg.join('\n')).setColor(embed_color)
      ]
    }));
  }
});
