import { DateTime } from 'luxon';
import Account from '#models/account';
import { stripe } from '#services/stripe';
import type Stripe from 'stripe';

export type StripeSubCache =
  | {
      subscriptionId: string | null;
      status: Stripe.Subscription.Status;
      priceId: string | null;
      currentPeriodStart: number | null;
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
      pendingPriceId: string | null;
      pendingAt: number | null;
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
    expand: ['data.default_payment_method', 'data.schedule'],
  });

  // No subscription: clear all fields.
  if (subscriptions.data.length === 0) {
    account.stripeSubscriptionId = null;
    account.stripeSubscriptionStatus = null;
    account.stripePriceId = null;
    account.stripeCurrentPeriodStart = null;
    account.stripeCurrentPeriodEnd = null;
    account.stripeCancelAtPeriodEnd = null;
    account.stripePendingPriceId = null;
    account.stripePendingAt = null;
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

  const pending = pendingPhaseChange(subscription, priceId);

  const subData: StripeSubCache = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId,
    pendingPriceId: pending?.priceId ?? null,
    pendingAt: pending?.at ?? null,
    currentPeriodStart: item?.current_period_start ?? null,
    currentPeriodEnd: item?.current_period_end ?? null,
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
  account.stripePendingPriceId = subData.pendingPriceId;
  account.stripePendingAt = subData.pendingAt;
  account.stripePaymentMethodBrand = subData.paymentMethod?.brand ?? null;
  account.stripePaymentMethodLast4 = subData.paymentMethod?.last4 ?? null;
  account.stripeLastSyncedAt = DateTime.utc();

  await account.save();

  return subData;
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;

  return typeof value === 'string' ? value : value.id;
}

/**
 * A plan change scheduled for later lives on a subscription schedule:
 * the subscription's items stay on the current price until the next
 * phase starts. This finds that next phase, when its price differs.
 */
function pendingPhaseChange(subscription: Stripe.Subscription, currentPriceId: string | null) {
  const schedule = subscription.schedule;

  if (!schedule || typeof schedule === 'string') return null;

  const now = Math.floor(Date.now() / 1000);
  const upcoming = schedule.phases
    .filter((phase) => phase.start_date > now)
    .sort((a, b) => a.start_date - b.start_date);
  const next = upcoming[0];

  if (!next) return null;

  const priceId = idOf(next.items[0]?.price);

  if (!priceId || priceId === currentPriceId) return null;

  return { priceId, at: next.start_date };
}
