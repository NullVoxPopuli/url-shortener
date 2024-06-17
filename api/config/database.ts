import path from 'node:path';
import env from '#start/env';
import { defineConfig } from '@adonisjs/lucid';
import { findUp } from 'find-up';

// Adonis builds the whole app into a `build` directory
// so all our paths end up being incorrect.
// We need to manually construct a location for the sqlite3 file.
//
// Adonis should consider getting rid of the build directory.
// (And Svelte should do the same with their .svelte) directory.
const pJsonPath = await findUp('package.json');
if (!pJsonPath) {
  throw new Error('Could not  determine project path');
}
const project = path.dirname(pJsonPath);
const sqlitePath = path.join(project, 'db.sqlite3');

const dbConfig = defineConfig({
  connection: env.get('DB_CONNECTION'),
  connections: {
    sqlite3: {
      client: 'better-sqlite3',
      connection: {
        filename: sqlitePath,
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
    postgres: {
      client: 'pg',
      connection: {
        ssl: {
          rejectUnauthorized: false,
        },
        connectionString: env.get('DATABASE_URL'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
});

export default dbConfig;
