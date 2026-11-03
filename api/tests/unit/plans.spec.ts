import { test } from '@japa/runner';
import { assert } from 'chai';
import {
  PLANS,
  billingIntervalFor,
  intervalForPriceId,
  pendingDowngradeFor,
  planFor,
  planForPriceId,
} from '#services/plans';

const VAST = PLANS[3];

test.group('plans', () => {
  test('every price id is unique across plans and intervals', () => {
    const ids = PLANS.flatMap((plan) => [plan.prices.month.id, plan.prices.year.id]);

    assert.strictEqual(new Set(ids).size, ids.length);
  });

  test('a monthly or a yearly price id resolves to its plan', () => {
    assert.strictEqual(planForPriceId(VAST.prices.month.id)?.key, 'vast');
    assert.strictEqual(planForPriceId(VAST.prices.year.id)?.key, 'vast');
    assert.isNull(planForPriceId('price_unknown'));
    assert.isNull(planForPriceId(null));
  });

  test('the interval comes from the price id', () => {
    assert.strictEqual(intervalForPriceId(VAST, VAST.prices.month.id), 'month');
    assert.strictEqual(intervalForPriceId(VAST, VAST.prices.year.id), 'year');
    assert.isNull(intervalForPriceId(VAST, PLANS[0].prices.month.id));
  });

  test('an account on a yearly price is on the plan, billed yearly', () => {
    const account = { isInternal: false, stripePriceId: VAST.prices.year.id };

    assert.strictEqual(planFor(account).key, 'vast');
    assert.strictEqual(billingIntervalFor(account), 'year');
  });

  test('accounts without a paid price have no interval', () => {
    assert.isNull(billingIntervalFor({ isInternal: true, stripePriceId: null }));
    assert.isNull(billingIntervalFor({ isInternal: false, stripePriceId: null }));
  });

  test('planFor honors the downgrade grace until its date', () => {
    const now = 1_000_000;
    const account = {
      isInternal: false,
      stripePriceId: PLANS[0].prices.month.id,
      stripeDowngradedFromPriceId: PLANS[2].prices.month.id,
      stripeDowngradedUntil: now + 100,
    };

    assert.strictEqual(planFor(account, now).key, 'pro');
    assert.deepEqual(pendingDowngradeFor(account, now), { plan: PLANS[0], at: now + 100 });

    assert.strictEqual(planFor(account, now + 100).key, 'base');
    assert.isNull(pendingDowngradeFor(account, now + 100));
  });

  test('no pending downgrade without a grace, or on a free account', () => {
    assert.isNull(
      pendingDowngradeFor({ isInternal: false, stripePriceId: PLANS[2].prices.month.id })
    );
    assert.isNull(
      pendingDowngradeFor({
        isInternal: true,
        stripePriceId: null,
        stripeDowngradedFromPriceId: PLANS[2].prices.month.id,
        stripeDowngradedUntil: Number.MAX_SAFE_INTEGER,
      })
    );
  });
});
