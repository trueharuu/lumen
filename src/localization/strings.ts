export const STRINGS = {
  admin: {
    persist: {
      saved_data: ':white_check_mark: Saved persist data for <@{target_id}>',
      no_data_found: ':warning: No persist data found for <@{target_id}>',
      data_header: '{chevron}',
    },
  },
  utility: {
    level_self: 'Your bot level is **{level}**',
    level_other: '<@{target_id}>\'s bot level is **{level}**',
    pong: 'Pong! Took **{ms}ms**',
  },
  commands: {
    parsing_error: ':x: Parsing error: `{message}`',
    execution_error: ':warning: `{message}`',
    preprocessing_error: ':x: Preprocessing error: `{message}`',
    not_allowed: ':warning: `You are not allowed to use this command.`',
  },
  config: {
    uploaded:
      ':white_check_mark: Uploaded! This server\'s prefixes are {prefixes}',
    reset: ':white_check_mark: This server\'s config has been reset',
    no_config:
      ':warning: This server has no config. The default one has been provided.',
  },
} as const;
