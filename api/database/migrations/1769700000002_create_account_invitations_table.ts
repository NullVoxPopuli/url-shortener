import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'account_invitations';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
      table.uuid('invited_by').notNullable().references('id').inTable('users').onDelete('CASCADE');

      table.uuid('token').notNullable().unique();
      table.string('role').notNullable().defaultTo('member');

      table.timestamp('created_at').notNullable();
      table.timestamp('expires_at').notNullable();
      table.timestamp('accepted_at').nullable();
      table.uuid('accepted_by').nullable();

      table.index(['account_id']);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
