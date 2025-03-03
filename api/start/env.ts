import { confirm } from 'node-confirm';

/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env';

const env = await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  DOMAIN: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_CONNECTION: Env.schema.string() || 'sqlite3',
  DATABASE_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring ally package
  |----------------------------------------------------------
  */
  GITHUB_CLIENT_ID: Env.schema.string(),
  GITHUB_CLIENT_SECRET: Env.schema.string(),
  GOOGLE_CLIENT_ID: Env.schema.string(),
  GOOGLE_CLIENT_SECRET: Env.schema.string(),
  TWITTER_CLIENT_ID: Env.schema.string(),
  TWITTER_CLIENT_SECRET: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),
});

export default env;

export const HOST = env.get('HOST');
export const DOMAIN = env.get('DOMAIN');
export const isPG = env.get('DB_CONNECTION') === 'postgres';

// Probably just for testing
export const API_DOMAIN = `api.${DOMAIN}:${env.get('PORT')}`;

console.log(`
  NODE_ENV: ${env.get('NODE_ENV')}
  HOST: ${env.get('HOST')}
  PORT: ${env.get('PORT')}
  DOMAIN: ${env.get('DOMAIN')}
  DB_CONNECTION: ${env.get('DB_CONNECTION')}
`);

if (!process.env.DEPLOYMENT_PLATFORM) {
  if (env.get('DATABASE_URL').includes('rds')) {
    console.log('You are bout to use the production database. Are you sure?');
    await confirm();
  }
}
