import { isPG } from '#start/env';
import { BaseSchema } from '@adonisjs/lucid/schema';

/**
 * For users to generate their own tokens if they were on a different
 * domain / server and can't rely on our session based auth.
 *
 * See: https://docs.adonisjs.com/guides/authentication/access-tokens-guard
 */
export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      if (isPG) {
        table
          .uuid('tokenable_id')
          .notNullable()
          .unsigned()
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
      } else {
        table
          .string('tokenable_id')
          .notNullable()
          .unsigned()
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
      }

      table.string('type').notNullable();
      table.string('name').nullable();
      table.string('hash').notNullable();
      table.text('abilities').notNullable();
      table.timestamp('created_at');
      table.timestamp('updated_at');
      table.timestamp('last_used_at').nullable();
      table.timestamp('expires_at').nullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
