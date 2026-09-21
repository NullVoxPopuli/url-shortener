import { test } from '@japa/runner';
import { assert } from 'chai';
import Account from '#models/account';
import { overridePlan } from '#services/plan_override';
import { planFor } from '#services/plans';

function makeAccount(overrides?: Partial<Account>) {
  const account = new Account();

  account.isInternal = false;
  account.stripePriceId = null;
  account.stripeSubscriptionStatus = null;
  Object.assign(account, overrides);

  // avoid touching the database in a unit test
  account.save = async () => account;

  return account;
}

test.group('overridePlan', () => {
  test('paid plans set price + active status', async () => {
    const account = makeAccount();

    await overridePlan(account, 'pro');

    assert.strictEqual(planFor(account).key, 'pro');
    assert.strictEqual(account.stripeSubscriptionStatus, 'active');
    assert.isFalse(account.isInternal);
  });

  test('internal sets the unlimited plan', async () => {
    const account = makeAccount({ stripePriceId: 'price_x', stripeSubscriptionStatus: 'active' });

    await overridePlan(account, 'internal');

    assert.strictEqual(planFor(account).key, 'internal');
    assert.isTrue(account.isInternal);
    assert.isNull(account.stripePriceId);
  });

  test('none resets to the starter allowance', async () => {
    const account = makeAccount({ isInternal: true });

    await overridePlan(account, 'none');

    assert.strictEqual(planFor(account).key, 'none');
    assert.isFalse(account.isInternal);
  });

  test('unknown plans throw', async () => {
    const account = makeAccount();

    try {
      await overridePlan(account, 'enterprise-turbo');
      assert.fail('expected a throw');
    } catch (error) {
      assert.include((error as Error).message, 'Unknown plan');
    }
  });
});
