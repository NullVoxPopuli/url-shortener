import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'accounts';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      /**
       * Stripe customer per Account (our billing unit).
       *
       * We intentionally store "current state" locally so our app logic can
       * reference ONE source of truth (the Account row), updated via webhooks
       * and an eager sync on the success redirect.
       */
      table.string('stripe_customer_id').nullable().unique();
      table.string('stripe_subscription_id').nullable();
      table.string('stripe_subscription_status').nullable();
      table.string('stripe_price_id').nullable();

      /**
       * Stripe uses unix timestamps (seconds). We store as bigint to avoid
       * timezone surprises.
       */
      table.bigInteger('stripe_current_period_start').nullable();
      table.bigInteger('stripe_current_period_end').nullable();
      table.boolean('stripe_cancel_at_period_end').nullable();

      table.string('stripe_payment_method_brand').nullable();
      table.string('stripe_payment_method_last4').nullable();

      table.timestamp('stripe_last_synced_at', { useTz: true }).nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stripe_customer_id');
      table.dropColumn('stripe_subscription_id');
      table.dropColumn('stripe_subscription_status');
      table.dropColumn('stripe_price_id');
      table.dropColumn('stripe_current_period_start');
      table.dropColumn('stripe_current_period_end');
      table.dropColumn('stripe_cancel_at_period_end');
      table.dropColumn('stripe_payment_method_brand');
      table.dropColumn('stripe_payment_method_last4');
      table.dropColumn('stripe_last_synced_at');
    });
  }
}
