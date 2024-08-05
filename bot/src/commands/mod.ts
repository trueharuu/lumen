import { Lumen } from '../lumen.js';
import { adminEvents, AdminPersistGet, AdminPersistSave } from './admin.js';
import { LevelCommand } from './level.js';
import { PingCommand } from './ping.js';

export function register(l: Lumen) {
  l.register(PingCommand);
  l.register(LevelCommand);

  l.register(AdminPersistSave);
  l.register(AdminPersistGet);

  adminEvents(l);
}
