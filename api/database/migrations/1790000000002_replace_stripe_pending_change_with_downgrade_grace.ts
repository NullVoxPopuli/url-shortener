import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'accounts';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // The portal applies changes at once, so Stripe never schedules one.
      table.dropColumn('stripe_pending_price_id');
      table.dropColumn('stripe_pending_at');

      /**
       * A downgrade applies in Stripe at once, but the account paid for
       * the higher plan through the end of the period. These remember
       * that plan and the date it was paid through, so plan checks use
       * it until then.
       */
      table.string('stripe_downgraded_from_price_id').nullable();
      table.bigInteger('stripe_downgraded_until').nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stripe_downgraded_from_price_id');
      table.dropColumn('stripe_downgraded_until');
      table.string('stripe_pending_price_id').nullable();
      table.bigInteger('stripe_pending_at').nullable();
    });
  }
}
