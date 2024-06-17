import env from '#start/env';
import { BaseSchema } from '@adonisjs/lucid/schema';

export default class SetupExtensions extends BaseSchema {
  async up() {
    if (env.get('DB_CONNECTION') === 'postgres') {
      this.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    }
  }

  async down() {
    if (env.get('DB_CONNECTION') === 'postgres') {
      this.schema.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
    }
  }
}
