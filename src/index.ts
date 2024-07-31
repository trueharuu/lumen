import { Lumen } from './lumen.js';
import { parse } from '@iarna/toml';
import { Config } from './model.js';
import { readFileSync } from 'node:fs';
import { register } from './commands/mod.js';

void (async () => {
    const config = parse(readFileSync('config.toml', 'utf-8')) as never as Config;
    const lumen = new Lumen(config);

    register(lumen);

    await lumen.start();
})();