import { DateTime } from 'luxon';
import Account from '#models/account';
import { stripe } from '#services/stripe';
import { effectivePriceId, isDowngradeGraceActive, planRank } from '#services/plans';
import type Stripe from 'stripe';

export type StripeSubCache =
  | {
      subscriptionId: string | null;
      status: Stripe.Subscription.Status;
      priceId: string | null;
      currentPeriodStart: number | null;
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
      downgradedFromPriceId: string | null;
      downgradedUntil: number | null;
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

  // Atomically set the customer ID only if no other request beat us to it.
  const updated = await Account.query()
    .where('id', account.id)
    .whereNull('stripe_customer_id')
    .update({ stripe_customer_id: customer.id });

  // Lucid .update() returns the number of affected rows (as a number or wrapped in an array).
  const affectedRows = Array.isArray(updated) ? updated[0] : updated;

  if (affectedRows === 0) {
    // Another request already created a customer — clean up the orphan.
    // Best-effort: an orphaned (never-used) customer is harmless, so a
    // failed delete should not fail the caller's checkout.
    try {
      await stripe.customers.del(customer.id);
    } catch (error) {
      console.error(`[STRIPE] Failed to delete orphaned customer ${customer.id}`, error);
    }
    await account.refresh();
    return account.stripeCustomerId!;
  }

  account.stripeCustomerId = customer.id;

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
): Promise<StripeSubCache | null> {
  const account = await Account.findBy('stripe_customer_id', customerId);
  if (!account) return null;

  return await syncStripeDataToAccount(account);
}

export async function syncStripeDataToAccount(account: Account): Promise<StripeSubCache | null> {
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
    account.stripeDowngradedFromPriceId = null;
    account.stripeDowngradedUntil = null;
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

  const currentPeriodEnd = item?.current_period_end ?? null;
  const grace = downgradeGraceAfterSync(account, {
    priceId,
    currentPeriodEnd,
    isActive: ACTIVE_STATUSES.has(subscription.status),
  });

  const subData: StripeSubCache = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId,
    downgradedFromPriceId: grace?.fromPriceId ?? null,
    downgradedUntil: grace?.until ?? null,
    currentPeriodStart: item?.current_period_start ?? null,
    currentPeriodEnd,
    // The portal can schedule a cancellation as a `cancel_at` date
    // instead of the flag; both mean the plan ends and does not renew.
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end || subscription.cancel_at),
    paymentMethod,
  };

  account.stripeSubscriptionId = subData.subscriptionId;
  account.stripeSubscriptionStatus = subData.status;
  account.stripePriceId = subData.priceId;
  account.stripeCurrentPeriodStart = subData.currentPeriodStart;
  account.stripeCurrentPeriodEnd = subData.currentPeriodEnd;
  account.stripeCancelAtPeriodEnd = subData.cancelAtPeriodEnd;
  account.stripeDowngradedFromPriceId = subData.downgradedFromPriceId;
  account.stripeDowngradedUntil = subData.downgradedUntil;
  account.stripePaymentMethodBrand = subData.paymentMethod?.brand ?? null;
  account.stripePaymentMethodLast4 = subData.paymentMethod?.last4 ?? null;
  account.stripeLastSyncedAt = DateTime.utc();

  await account.save();

  return subData;
}

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

/**
 * Stripe applies a downgrade at once, but the period was paid at the
 * higher plan. When the price drops, remember the plan it dropped from
 * and the end of the paid period. An upgrade, a cancellation, or the
 * date passing ends the grace.
 */
function downgradeGraceAfterSync(
  account: Account,
  next: { priceId: string | null; currentPeriodEnd: number | null; isActive: boolean }
): { fromPriceId: string; until: number } | null {
  if (!next.isActive || !next.priceId) return null;

  const now = Math.floor(Date.now() / 1000);
  const previousEffective = effectivePriceId(account, now);
  const existing =
    isDowngradeGraceActive(account, now) && account.stripeDowngradedFromPriceId
      ? { fromPriceId: account.stripeDowngradedFromPriceId, until: account.stripeDowngradedUntil! }
      : null;

  if (next.priceId === previousEffective) return existing;

  if (planRank(next.priceId) >= planRank(previousEffective)) return null;

  if (existing) return existing;

  if (!previousEffective || !next.currentPeriodEnd || next.currentPeriodEnd <= now) return null;

  return { fromPriceId: previousEffective, until: next.currentPeriodEnd };
}
