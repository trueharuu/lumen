export interface Config {
  token: string
  config_prefix: string
  admins: Array<string>
}

export interface GuildConfig {
  prefixes: Array<string>
  allow_mention_prefix: boolean
  levels: Record<string, number>
  plugins: Plugins
}

export interface GuildData {
  id: string
  persist?: Record<string, GuildMemberPersistData>
}

export interface GuildMemberPersistData {
  nickname?: string
  roles?: Array<string>
  deaf?: boolean
  mute?: boolean
}

export interface Plugins {
  admin: AdminPlugin
  commands: CommandsPlugin
}
export interface Plugin {
  enabled: boolean
}

export interface AdminPlugin extends Plugin {
  persist: AdminPersistPlugin
}

export interface AdminPersistPlugin extends Plugin {
  roles: boolean
  nickname: boolean
  voice: boolean
}

export interface CommandsPlugin extends Plugin {
  interactions: boolean
  prefixed: boolean
}
