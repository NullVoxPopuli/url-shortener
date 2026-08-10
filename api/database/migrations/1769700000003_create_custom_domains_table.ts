import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'custom_domains';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
      table.string('hostname').notNullable().unique();

      table.timestamp('created_at').notNullable();

      table.index(['account_id']);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
