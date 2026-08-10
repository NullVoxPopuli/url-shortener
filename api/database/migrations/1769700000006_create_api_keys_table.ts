import { BaseSchema } from '@adonisjs/lucid/schema';

/**
 * API keys are Adonis access tokens whose tokenable is an
 * *account membership* (not a user): a key is pinned to one
 * user-in-one-account, and removing that membership revokes the
 * key via the CASCADE.
 *
 * See: https://docs.adonisjs.com/guides/authentication/access-tokens-guard
 */
export default class extends BaseSchema {
  protected tableName = 'api_keys';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      table
        .integer('tokenable_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('account_memberships')
        .onDelete('CASCADE');

      table.string('type').notNullable();
      table.string('name').nullable();
      table.string('hash').notNullable();
      table.text('abilities').notNullable();
      table.timestamp('created_at');
      table.timestamp('updated_at');
      table.timestamp('last_used_at').nullable();
      table.timestamp('expires_at').nullable();

      table.index(['tokenable_id']);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
