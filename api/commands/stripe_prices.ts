import { BaseCommand } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';

/**
 * Prints the active products and their recurring prices from the
 * configured Stripe account, in the shape `PLANS` uses, so the ids in
 * app/services/plans.ts can be copied from real data.
 */
export default class StripePrices extends BaseCommand {
  static commandName = 'stripe:prices';
  static description = 'List Stripe products and recurring prices in the PLANS shape';

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  };

  async run() {
    const { stripe } = await import('#services/stripe');

    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, type: 'recurring', limit: 100 }),
    ]);

    for (const product of products.data) {
      const own = prices.data.filter(
        (price) =>
          (typeof price.product === 'string' ? price.product : price.product.id) === product.id
      );

      this.logger.info(`${product.name}`);
      this.logger.info(`  stripeProductId: '${product.id}',`);
      this.logger.info(`  prices: {`);

      for (const price of own) {
        const interval = price.recurring?.interval ?? 'one-time';
        const amount = price.unit_amount ?? 0;

        this.logger.info(`    ${interval}: { id: '${price.id}', amountInCents: ${amount} },`);
      }

      this.logger.info(`  },`);
      this.logger.info('');
    }
  }
}
