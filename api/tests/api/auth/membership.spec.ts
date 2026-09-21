import { test } from '@japa/runner';
import { assert } from 'chai';
import GitHubController from '#controllers/auth/github';
import AccountMembership from '#models/account_membership';
import Account from '#models/account';
import { glimdownOwner } from '#consts';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';

test.group('Auth | memberships', (group) => {
  setup(group);

  test('signup creates an admin membership in the personal account', async () => {
    let controller = new GitHubController();
    let user = await controller.findOrCreate('123456', 'someone', 'token');

    assert.ok(user);

    let memberships = await AccountMembership.query().where('user_id', user!.id);

    assert.strictEqual(memberships.length, 1);
    assert.strictEqual(memberships[0].role, 'admin');
    assert.strictEqual(memberships[0].account_id, user!.account_id);
  });

  test('staff github ids get the staff flag + glimdown membership', async () => {
    let controller = new GitHubController();
    let user = await controller.findOrCreate('199018', 'NullVoxPopuli', 'token');

    assert.ok(user);

    await controller.ensureSpecialGrants(user!);
    await user!.refresh();

    assert.isTrue(user!.isStaff);

    let glimdownMembership = await AccountMembership.query()
      .where('user_id', user!.id)
      .where('account_id', glimdownOwner.id)
      .first();

    assert.ok(glimdownMembership, 'has membership in the glimdown account');
    assert.strictEqual(glimdownMembership!.role, 'admin');

    // the ACTIVE account stays the personal one
    let personal = await Account.find(user!.account_id);

    assert.ok(personal);
    assert.notStrictEqual(user!.account_id, glimdownOwner.id);
  });

  test('non-staff users get no special grants', async () => {
    let controller = new GitHubController();
    let { user } = await createNewAccount();

    await controller.ensureSpecialGrants(user);
    await user.refresh();

    assert.isFalse(Boolean(user.isStaff));

    let glimdownMembership = await AccountMembership.query()
      .where('user_id', user.id)
      .where('account_id', glimdownOwner.id)
      .first();

    assert.isNull(glimdownMembership);
  });

  test('ensure is idempotent', async () => {
    let { user, account } = await createNewAccount();

    await AccountMembership.ensure({ accountId: account.id, userId: user.id, role: 'admin' });
    await AccountMembership.ensure({ accountId: account.id, userId: user.id });

    let memberships = await AccountMembership.query()
      .where('user_id', user.id)
      .where('account_id', account.id);

    assert.strictEqual(memberships.length, 1);
    assert.strictEqual(memberships[0].role, 'admin');
  });
});
