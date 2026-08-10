import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'account_memberships';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

      table.string('role').notNullable().defaultTo('member');

      table.timestamp('created_at').notNullable();

      table.unique(['account_id', 'user_id']);
      table.index(['user_id']);
    });

    /**
     * Backfill: every existing user is a member of their account —
     * as admin when they are the account's admin.
     */
    this.defer(async (db) => {
      await db.rawQuery(`
        INSERT INTO account_memberships (account_id, user_id, role, created_at)
        SELECT
          users.account_id,
          users.id,
          CASE WHEN accounts.admin_id = users.id THEN 'admin' ELSE 'member' END,
          CURRENT_TIMESTAMP
        FROM users
        JOIN accounts ON accounts.id = users.account_id
      `);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
