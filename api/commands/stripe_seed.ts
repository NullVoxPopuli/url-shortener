import { BaseCommand, flags } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';
// type-only: erased at runtime, so the command still lazy-loads its deps
import type { stripe } from '#services/stripe';

/**
 * Idempotent Stripe test-data seeder.
 *
 * Every step is get-or-create (retrieve/list first, create only when
 * missing), so this command is safe to run:
 * - repeatedly
 * - against a brand-new (or wiped/recreated) Stripe sandbox
 * - after wiping the local database
 *
 * Notably we do NOT rely on:
 * - Stripe CLI fixtures: they replay raw POSTs, so re-runs duplicate data.
 * - Idempotency-Key headers: Stripe prunes them after ~24h, so they only
 *   dedupe same-day re-runs.
 *
 * Stable handles used instead:
 * - the product gets an explicit, client-chosen id
 * - the price gets a `lookup_key` (prices cannot have client-chosen ids;
 *   lookup keys are Stripe's recommended stable handle:
 *   https://docs.stripe.com/products-prices/manage-prices#lookup-keys)
 * - the customer is found via the account's stored `stripe_customer_id`
 *   (or created via the same code path the app uses)
 */

const PRODUCT_ID = 'prod_url_shortener_dev';
const PRICE_LOOKUP_KEY = 'url_shortener_monthly';

export default class StripeSeed extends BaseCommand {
  static commandName = 'stripe:seed';
  static description =
    'Idempotently (re)create Stripe test data: product, price, and optionally an active subscription for an account';

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  };

  @flags.string({
    description: 'Account id to give an active subscription (paid with the pm_card_visa test card)',
  })
  declare account?: string;

  async run() {
    const { stripe } = await import('#services/stripe');
    const { default: env } = await import('#start/env');

    assertTestMode(env.get('STRIPE_SECRET_KEY'));

    const product = await ensureProduct(stripe);
    this.logger.info(`Product: ${product.id} (${product.name})`);

    const price = await ensurePrice(stripe, product.id);
    this.logger.info(`Price: ${price.id} (lookup_key: ${price.lookup_key})`);

    if (env.get('STRIPE_PRICE_ID') !== price.id) {
      this.logger.warning(`STRIPE_PRICE_ID in your .env does not match. Set:`);
      this.logger.warning(`  STRIPE_PRICE_ID=${price.id}`);
    }

    if (!this.account) {
      await this.printAccounts();
      return;
    }

    await this.subscribeAccount(this.account, price.id);
  }

  async printAccounts() {
    const { default: Account } = await import('#models/account');

    const accounts = await Account.query().orderBy('created_at').limit(20);

    this.logger.info('');
    this.logger.info('To give an account an active subscription, pass --account=<id>:');
    for (const account of accounts) {
      this.logger.info(
        `  ${account.id}  ${account.name}  (subscription: ${account.stripeSubscriptionStatus ?? 'none'})`
      );
    }
  }

  async subscribeAccount(accountId: string, priceId: string) {
    const { stripe } = await import('#services/stripe');
    const { default: Account } = await import('#models/account');
    const { getOrCreateStripeCustomerIdForAccount, syncStripeDataToAccount } = await import(
      '#services/stripe_sync'
    );

    const account = await Account.find(accountId);
    if (!account) {
      this.logger.error(`Account ${accountId} not found`);
      this.exitCode = 1;
      return;
    }

    // Same code path the checkout flow uses.
    const customerId = await getOrCreateStripeCustomerIdForAccount({
      account,
      userId: account.admin_id,
    });
    this.logger.info(`Customer: ${customerId}`);

    const paymentMethodId = await ensureDefaultPaymentMethod(stripe, customerId);
    this.logger.info(`Payment method: ${paymentMethodId}`);

    const subscription = await ensureSubscription(stripe, {
      customerId,
      priceId,
      paymentMethodId,
    });
    this.logger.info(`Subscription: ${subscription.id} (${subscription.status})`);

    await syncStripeDataToAccount(account);
    this.logger.success(
      `Synced. Account ${account.id} now has status: ${account.stripeSubscriptionStatus}`
    );
  }
}

type StripeClient = typeof stripe;

/**
 * Refuse to run against live mode. Test keys start with sk_test_ / rk_test_.
 */
function assertTestMode(secretKey: string) {
  if (!/^(sk|rk)_test_/.test(secretKey)) {
    throw new Error('stripe:seed only runs with a test/sandbox STRIPE_SECRET_KEY (sk_test_...)');
  }
}

async function ensureProduct(stripe: StripeClient) {
  try {
    const product = await stripe.products.retrieve(PRODUCT_ID);

    if (!product.active) {
      return await stripe.products.update(PRODUCT_ID, { active: true });
    }

    return product;
  } catch (error) {
    if ((error as { code?: string }).code !== 'resource_missing') throw error;

    return await stripe.products.create({
      id: PRODUCT_ID,
      name: 'nvp.gg (dev seed)',
    });
  }
}

async function ensurePrice(stripe: StripeClient, productId: string) {
  const existing = await stripe.prices.list({
    lookup_keys: [PRICE_LOOKUP_KEY],
    active: true,
    limit: 1,
  });

  if (existing.data[0]) return existing.data[0];

  return await stripe.prices.create({
    product: productId,
    currency: 'usd',
    unit_amount: 500,
    recurring: { interval: 'month' },
    lookup_key: PRICE_LOOKUP_KEY,
    // If a stale/archived price still holds the key, steal it.
    transfer_lookup_key: true,
  });
}

async function ensureDefaultPaymentMethod(stripe: StripeClient, customerId: string) {
  const customer = await stripe.customers.retrieve(customerId);

  if (!customer.deleted) {
    const current = customer.invoice_settings.default_payment_method;
    if (typeof current === 'string') return current;
    if (current) return current.id;
  }

  // Test-mode token; each attach mints a fresh pm_... id.
  const paymentMethod = await stripe.paymentMethods.attach('pm_card_visa', {
    customer: customerId,
  });

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });

  return paymentMethod.id;
}

async function ensureSubscription(
  stripe: StripeClient,
  params: { customerId: string; priceId: string; paymentMethodId: string }
) {
  const { customerId, priceId, paymentMethodId } = params;

  const existing = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    price: priceId,
    limit: 1,
  });

  if (existing.data[0]) return existing.data[0];

  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    default_payment_method: paymentMethodId,
  });
}
