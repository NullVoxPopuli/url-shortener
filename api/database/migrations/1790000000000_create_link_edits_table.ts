import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'link_edits';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.uuid('link_id').notNullable().references('id').inTable('links').onDelete('CASCADE');

      /**
       * Denormalized from the link: the monthly edit quota is per
       * account, and it must count edits of links deleted since.
       */
      table
        .uuid('account_id')
        .notNullable()
        .references('id')
        .inTable('accounts')
        .onDelete('CASCADE');
      table.uuid('edited_by').notNullable().references('id').inTable('users').onDelete('CASCADE');

      table.text('previous_original').notNullable();
      table.timestamp('previous_expires_at').nullable();

      table.timestamp('created_at').notNullable();

      // "edits by account X this month"
      table.index(['account_id', 'created_at']);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
