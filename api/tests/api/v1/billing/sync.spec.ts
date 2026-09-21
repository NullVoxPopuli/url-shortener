import { randomUUID } from 'node:crypto';
import { test } from '@japa/runner';
import { assert } from 'chai';
import type Stripe from 'stripe';
import Account from '#models/account';
import { stripe } from '#services/stripe';
import { syncStripeDataToAccount } from '#services/stripe_sync';
import { PLANS, pendingDowngradeFor } from '#services/plans';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';

/**
 * Stand in for Stripe's subscription list for the duration of one test.
 */
async function withSubscriptions<T>(subscriptions: object[], run: () => Promise<T>) {
  const original = stripe.subscriptions.list;

  stripe.subscriptions.list = (async () => ({
    data: subscriptions,
  })) as unknown as typeof original;

  try {
    return await run();
  } finally {
    stripe.subscriptions.list = original;
  }
}

function subscription(overrides: Partial<Stripe.Subscription>) {
  return {
    id: 'sub_1',
    status: 'active',
    cancel_at_period_end: false,
    cancel_at: null,
    schedule: null,
    default_payment_method: null,
    items: {
      data: [
        {
          price: { id: 'price_1' },
          current_period_start: 1788220800,
          current_period_end: 1790812800,
        },
      ],
    },
    ...overrides,
  };
}

test.group('syncStripeDataToAccount', (group) => {
  setup(group);

  test('a cancellation flagged at period end is stored', async () => {
    const { account } = await createNewAccount({
      account: { stripeCustomerId: `cus_${randomUUID()}` },
    });

    await withSubscriptions([subscription({ cancel_at_period_end: true })], () =>
      syncStripeDataToAccount(account)
    );

    const fresh = await Account.findOrFail(account.id);
    assert.isTrue(fresh.stripeCancelAtPeriodEnd);
    assert.strictEqual(fresh.stripeSubscriptionStatus, 'active');
  });

  test('a cancellation scheduled as a cancel_at date is stored too', async () => {
    const { account } = await createNewAccount({
      account: { stripeCustomerId: `cus_${randomUUID()}` },
    });

    await withSubscriptions([subscription({ cancel_at: 1790812800 })], () =>
      syncStripeDataToAccount(account)
    );

    const fresh = await Account.findOrFail(account.id);
    assert.isTrue(fresh.stripeCancelAtPeriodEnd);
  });

  test('a subscription without a scheduled cancellation clears the flag', async () => {
    const { account } = await createNewAccount({
      account: { stripeCustomerId: `cus_${randomUUID()}`, stripeCancelAtPeriodEnd: true },
    });

    await withSubscriptions([subscription({})], () => syncStripeDataToAccount(account));

    const fresh = await Account.findOrFail(account.id);
    assert.isFalse(fresh.stripeCancelAtPeriodEnd);
  });

  test('a downgrade scheduled for the next period is pending, and the current plan stays', async () => {
    const { account } = await createNewAccount({
      account: { stripeCustomerId: `cus_${randomUUID()}` },
    });
    const now = Math.floor(Date.now() / 1000);
    const pro = PLANS[2];
    const base = PLANS[0];

    await withSubscriptions(
      [
        subscription({
          items: {
            data: [
              {
                price: { id: pro.prices.month.id },
                current_period_start: now - 100,
                current_period_end: now + 1000,
              },
            ],
          } as unknown as Stripe.Subscription['items'],
          schedule: {
            phases: [
              {
                start_date: now - 100,
                end_date: now + 1000,
                items: [{ price: pro.prices.month.id }],
              },
              {
                start_date: now + 1000,
                end_date: now + 2000,
                items: [{ price: base.prices.month.id }],
              },
            ],
          } as unknown as Stripe.SubscriptionSchedule,
        }),
      ],
      () => syncStripeDataToAccount(account)
    );

    const fresh = await Account.findOrFail(account.id);
    assert.strictEqual(fresh.stripePriceId, pro.prices.month.id);
    assert.strictEqual(fresh.stripePendingPriceId, base.prices.month.id);
    assert.strictEqual(fresh.stripePendingAt, now + 1000);

    const downgrade = pendingDowngradeFor(fresh);
    assert.strictEqual(downgrade?.plan.key, 'base');
    assert.strictEqual(downgrade?.at, now + 1000);
  });

  test('a schedule whose next phase keeps the price is not a pending change', async () => {
    const { account } = await createNewAccount({
      account: {
        stripeCustomerId: `cus_${randomUUID()}`,
        stripePendingPriceId: 'price_old_pending',
        stripePendingAt: 1,
      },
    });
    const now = Math.floor(Date.now() / 1000);

    await withSubscriptions(
      [
        subscription({
          schedule: {
            phases: [
              { start_date: now - 100, end_date: now + 1000, items: [{ price: 'price_1' }] },
              { start_date: now + 1000, end_date: now + 2000, items: [{ price: 'price_1' }] },
            ],
          } as unknown as Stripe.SubscriptionSchedule,
        }),
      ],
      () => syncStripeDataToAccount(account)
    );

    const fresh = await Account.findOrFail(account.id);
    assert.isNull(fresh.stripePendingPriceId);
    assert.isNull(fresh.stripePendingAt);
  });
});
