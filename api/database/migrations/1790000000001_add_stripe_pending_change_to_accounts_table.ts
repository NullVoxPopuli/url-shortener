import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'accounts';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      /**
       * A plan change scheduled for later (a downgrade at the end of the
       * period). The current price stays in stripe_price_id until Stripe
       * switches, so the account keeps its current plan until then.
       */
      table.string('stripe_pending_price_id').nullable();
      table.bigInteger('stripe_pending_at').nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stripe_pending_price_id');
      table.dropColumn('stripe_pending_at');
    });
  }
}
