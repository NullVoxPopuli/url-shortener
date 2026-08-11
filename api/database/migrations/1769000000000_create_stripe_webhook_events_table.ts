import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'stripe_webhook_events';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      /**
       * Stripe event IDs are globally unique and stable across retries.
       * We use them as our dedupe key.
       */
      table.string('event_id').primary();
      table.string('event_type').notNullable();
      table.string('customer_id').nullable();
      table.timestamp('processed_at', { useTz: true }).notNullable().defaultTo(this.now());
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
