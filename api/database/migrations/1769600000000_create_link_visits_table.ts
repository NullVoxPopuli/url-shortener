import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'link_visits';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();

      table.uuid('link_id').notNullable().references('id').inTable('links').onDelete('CASCADE');

      table.timestamp('visited_at').notNullable();

      /**
       * Enough for stats without hoarding: where the click came from
       * and what clicked. Truncated by the controller, not the schema,
       * so oversized headers do not error.
       */
      table.string('referrer', 2048).nullable();
      table.string('user_agent', 512).nullable();

      // Time-series queries: "visits for link X between A and B"
      table.index(['link_id', 'visited_at']);
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
