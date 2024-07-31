import { GuildMember, PartialGuildMember } from 'discord.js';
import { Lumen } from '../lumen.js';
import { GuildData } from '../model.js';
import { GuildMemberArg } from '../parser/builtin.js';

export function createPersistData(data: GuildData, v: PartialGuildMember | GuildMember): GuildData {
    data.persist ??= {};
    data.persist[v.id] = {
        roles: v.roles.cache.map(v => v.id),
        deaf: v.voice.serverDeaf || false,
        mute: v.voice.serverMute || false,
        nickname: v.nickname || undefined,
    };

    return data;
}

export function adminEvents(l: Lumen) {
    l.event('guildMemberRemove', v => {
        const cfg = l.getConfig(v.guild.id);
        const data = l.getGuildData(v.guild.id);
        if (cfg.plugins.admin.enabled && cfg.plugins.admin.persist.enabled) {
            l.setGuildData(v.guild.id, createPersistData(data, v));
        }
    });

    l.event('guildMemberAdd', async v => {
        const cfg = l.getConfig(v.guild.id);
        const data = l.getGuildData(v.guild.id);
        if (cfg.plugins.admin.enabled && cfg.plugins.admin.persist.enabled) {
            if (cfg.plugins.admin.persist.nickname && data.persist?.[v.id].nickname !== undefined) {
                await v.setNickname(data.persist[v.id].nickname || null);
            }
        }
    });
}

import { command } from '../parser/command.js';

export const AdminPersistSave = command({
    parsers: [GuildMemberArg],
    meta: {
        name: 'persist save',
    },

    async check(ctx) {
        return ctx.lumen().getUserLevel(ctx.userId(), ctx.guildId()) >= 50;
    },

    async register(ctx) {
        return ctx.config().plugins.admin.enabled && ctx.config().plugins.admin.persist.enabled;
    },

    async execute(ctx, target) {
        const data = ctx.lumen().getGuildData(ctx.guildId());
        ctx.lumen().setGuildData(ctx.guildId(), createPersistData(data, target));
        await ctx.reply(`:white_check_mark: Saved persist data for <@${target.id}>`);
    }
});