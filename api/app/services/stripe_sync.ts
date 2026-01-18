import { DateTime } from 'luxon';
import Account from '#models/account';
import { stripe } from '#services/stripe';
import type Stripe from 'stripe';

export type STRIPE_SUB_CACHE =
  | {
      subscriptionId: string | null;
      status: Stripe.Subscription.Status;
      priceId: string | null;
      currentPeriodStart: number | null;
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        brand: string | null;
        last4: string | null;
      } | null;
    }
  | {
      status: 'none';
    };

/**
 * Create or reuse the Stripe Customer for an Account.
 *
 * Theo’s guide recommends storing this mapping in a KV store; we store it on
 * the Account row itself (our billing unit).
 */
export async function getOrCreateStripeCustomerIdForAccount(params: {
  account: Account;
  userId: string;
}): Promise<string> {
  const { account, userId } = params;

  if (account.stripeCustomerId) return account.stripeCustomerId;

  const customer = await stripe.customers.create({
    metadata: {
      accountId: account.id,
      userId,
    },
  });

  account.stripeCustomerId = customer.id;
  await account.save();

  return customer.id;
}

/**
 * SINGLE source of truth sync function.
 *
 * Called by:
 * - webhook handler
 * - /billing/success redirect handler
 */
export async function syncStripeDataToAccountByCustomerId(
  customerId: string
): Promise<STRIPE_SUB_CACHE | null> {
  const account = await Account.findBy('stripe_customer_id', customerId);
  if (!account) return null;

  return await syncStripeDataToAccount(account);
}

export async function syncStripeDataToAccount(account: Account): Promise<STRIPE_SUB_CACHE | null> {
  const customerId = account.stripeCustomerId;
  if (!customerId) return null;

  // Fetch latest subscription data from Stripe.
  // If you allow multiple subscriptions per customer, you’ll need a different schema.
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: 'all',
    expand: ['data.default_payment_method'],
  });

  // No subscription: clear all fields.
  if (subscriptions.data.length === 0) {
    account.stripeSubscriptionId = null;
    account.stripeSubscriptionStatus = null;
    account.stripePriceId = null;
    account.stripeCurrentPeriodStart = null;
    account.stripeCurrentPeriodEnd = null;
    account.stripeCancelAtPeriodEnd = null;
    account.stripePaymentMethodBrand = null;
    account.stripePaymentMethodLast4 = null;
    account.stripeLastSyncedAt = DateTime.utc();
    await account.save();

    return { status: 'none' };
  }

  const subscription = subscriptions.data[0];

  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? null;

  const paymentMethod =
    subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
      ? {
          brand: subscription.default_payment_method.card?.brand ?? null,
          last4: subscription.default_payment_method.card?.last4 ?? null,
        }
      : null;

  const subData: STRIPE_SUB_CACHE = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId,
    currentPeriodStart: subscription.current_period_start ?? null,
    currentPeriodEnd: subscription.current_period_end ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    paymentMethod,
  };

  account.stripeSubscriptionId = subData.subscriptionId;
  account.stripeSubscriptionStatus = subData.status;
  account.stripePriceId = subData.priceId;
  account.stripeCurrentPeriodStart = subData.currentPeriodStart;
  account.stripeCurrentPeriodEnd = subData.currentPeriodEnd;
  account.stripeCancelAtPeriodEnd = subData.cancelAtPeriodEnd;
  account.stripePaymentMethodBrand = subData.paymentMethod?.brand ?? null;
  account.stripePaymentMethodLast4 = subData.paymentMethod?.last4 ?? null;
  account.stripeLastSyncedAt = DateTime.utc();

  await account.save();

  return subData;
}
