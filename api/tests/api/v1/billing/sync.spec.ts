import { randomUUID } from 'node:crypto';
import { test } from '@japa/runner';
import { assert } from 'chai';
import type Stripe from 'stripe';
import Account from '#models/account';
import { stripe } from '#services/stripe';
import { syncStripeDataToAccount } from '#services/stripe_sync';
import { PLANS, pendingDowngradeFor, planFor } from '#services/plans';
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

  test('a downgrade keeps the previous plan until the paid period ends', async () => {
    const pro = PLANS[2];
    const base = PLANS[0];
    const now = Math.floor(Date.now() / 1000);
    const { account } = await createNewAccount({
      account: { stripeCustomerId: `cus_${randomUUID()}`, stripePriceId: pro.prices.month.id },
    });

    await withSubscriptions([subscription(onPrice(base.prices.month.id, now + 1000))], () =>
      syncStripeDataToAccount(account)
    );

    const fresh = await Account.findOrFail(account.id);
    assert.strictEqual(fresh.stripePriceId, base.prices.month.id);
    assert.strictEqual(fresh.stripeDowngradedFromPriceId, pro.prices.month.id);
    assert.strictEqual(fresh.stripeDowngradedUntil, now + 1000);
    assert.strictEqual(planFor(fresh).key, 'pro');
    assert.deepEqual(pendingDowngradeFor(fresh), { plan: base, at: now + 1000 });
  });

  test('a second downgrade during the grace keeps the original plan', async () => {
    const now = Math.floor(Date.now() / 1000);
    const { account } = await createNewAccount({
      account: {
        stripeCustomerId: `cus_${randomUUID()}`,
        stripePriceId: PLANS[1].prices.month.id,
        stripeDowngradedFromPriceId: PLANS[2].prices.month.id,
        stripeDowngradedUntil: now + 1000,
      },
    });

    await withSubscriptions([subscription(onPrice(PLANS[0].prices.month.id, now + 1000))], () =>
      syncStripeDataToAccount(account)
    );

    const fresh = await Account.findOrFail(account.id);
    assert.strictEqual(fresh.stripeDowngradedFromPriceId, PLANS[2].prices.month.id);
    assert.strictEqual(planFor(fresh).key, 'pro');
    assert.strictEqual(pendingDowngradeFor(fresh)?.plan.key, 'base');
  });

  test('an upgrade ends the grace', async () => {
    const now = Math.floor(Date.now() / 1000);
    const { account } = await createNewAccount({
      account: {
        stripeCustomerId: `cus_${randomUUID()}`,
        stripePriceId: PLANS[0].prices.month.id,
        stripeDowngradedFromPriceId: PLANS[2].prices.month.id,
        stripeDowngradedUntil: now + 1000,
      },
    });

    await withSubscriptions([subscription(onPrice(PLANS[3].prices.month.id, now + 1000))], () =>
      syncStripeDataToAccount(account)
    );

    const fresh = await Account.findOrFail(account.id);
    assert.isNull(fresh.stripeDowngradedFromPriceId);
    assert.isNull(fresh.stripeDowngradedUntil);
    assert.strictEqual(planFor(fresh).key, 'vast');
  });

  test('an expired grace is dropped', async () => {
    const now = Math.floor(Date.now() / 1000);
    const { account } = await createNewAccount({
      account: {
        stripeCustomerId: `cus_${randomUUID()}`,
        stripePriceId: PLANS[0].prices.month.id,
        stripeDowngradedFromPriceId: PLANS[2].prices.month.id,
        stripeDowngradedUntil: now - 10,
      },
    });

    await withSubscriptions([subscription(onPrice(PLANS[0].prices.month.id, now + 1000))], () =>
      syncStripeDataToAccount(account)
    );

    const fresh = await Account.findOrFail(account.id);
    assert.isNull(fresh.stripeDowngradedFromPriceId);
    assert.strictEqual(planFor(fresh).key, 'base');
    assert.isNull(pendingDowngradeFor(fresh));
  });

  test('a cancellation ends the grace', async () => {
    const now = Math.floor(Date.now() / 1000);
    const { account } = await createNewAccount({
      account: {
        stripeCustomerId: `cus_${randomUUID()}`,
        stripePriceId: PLANS[0].prices.month.id,
        stripeDowngradedFromPriceId: PLANS[2].prices.month.id,
        stripeDowngradedUntil: now + 1000,
      },
    });

    await withSubscriptions(
      [subscription({ ...onPrice(PLANS[0].prices.month.id, now + 1000), status: 'canceled' })],
      () => syncStripeDataToAccount(account)
    );

    const fresh = await Account.findOrFail(account.id);
    assert.isNull(fresh.stripeDowngradedFromPriceId);
  });
});

function onPrice(priceId: string, currentPeriodEnd: number): Partial<Stripe.Subscription> {
  return {
    items: {
      data: [
        {
          price: { id: priceId },
          current_period_start: currentPeriodEnd - 2000,
          current_period_end: currentPeriodEnd,
        },
      ],
    } as unknown as Stripe.Subscription['items'],
  };
}
