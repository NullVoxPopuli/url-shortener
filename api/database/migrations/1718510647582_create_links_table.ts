import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'links';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary();
      table.text('original').notNullable();
      table.integer('visits').defaultTo(0);

      table.uuid('owned_by').notNullable();
      table.uuid('created_by').notNullable();

      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
