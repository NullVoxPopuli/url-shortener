import { test } from '@japa/runner';
import { assert } from 'chai';
import Account from '#models/account';
import { overridePlan } from '#services/plan_override';
import { planFor } from '#services/plans';

function makeAccount(overrides?: Partial<Account>) {
  const account = new Account();

  account.isFree = false;
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

    await overridePlan(account, 'project');

    assert.strictEqual(planFor(account).key, 'project');
    assert.strictEqual(account.stripeSubscriptionStatus, 'active');
    assert.isFalse(account.isFree);
  });

  test('free sets the unlimited legacy plan', async () => {
    const account = makeAccount({ stripePriceId: 'price_x', stripeSubscriptionStatus: 'active' });

    await overridePlan(account, 'free');

    assert.strictEqual(planFor(account).key, 'free');
    assert.isTrue(account.isFree);
    assert.isNull(account.stripePriceId);
  });

  test('none resets to the starter allowance', async () => {
    const account = makeAccount({ isFree: true });

    await overridePlan(account, 'none');

    assert.strictEqual(planFor(account).key, 'none');
    assert.isFalse(account.isFree);
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
