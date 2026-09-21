import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import AccountMembership from '#models/account_membership';
import { API_DOMAIN } from '#start/env';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';

const jsonHeaders = { Accept: 'application/vnd.api+json' };

const get = (client: ApiClient, path: string, user?: User) => {
  const request = client.get(`http://${API_DOMAIN}/v1${path}`).headers(jsonHeaders);

  return user ? request.withGuard('web').loginAs(user) : request;
};

test.group('Related-link endpoints', (group) => {
  setup(group);

  test('accounts/:id/admin renders the admin user for members only', async ({ client }) => {
    const { user, account } = await createNewAccount();
    const outsider = await createNewAccount();

    const mine = await get(client, `/accounts/${account.id}/admin`, user);

    mine.assertStatus(200);
    assert.strictEqual(mine.body().data.type, 'user');
    assert.strictEqual(mine.body().data.id, user.id);

    const foreign = await get(client, `/accounts/${account.id}/admin`, outsider.user);

    foreign.assertStatus(404);
  });

  test('memberships/:id/user and /account resolve for co-members', async ({ client }) => {
    const { user, account } = await createNewAccount();

    const membership = await AccountMembership.query()
      .where('account_id', account.id)
      .where('user_id', user.id)
      .firstOrFail();

    const relatedUser = await get(client, `/memberships/${membership.id}/user`, user);

    relatedUser.assertStatus(200);
    assert.strictEqual(relatedUser.body().data.type, 'user');

    const relatedAccount = await get(client, `/memberships/${membership.id}/account`, user);

    relatedAccount.assertStatus(200);
    assert.strictEqual(relatedAccount.body().data.type, 'account');
  });

  test('unknown or hidden relations are strict errors', async ({ client }) => {
    const { user, account } = await createNewAccount();

    const bogus = await get(client, `/accounts/${account.id}/bogus`, user);

    assert.oneOf(bogus.status(), [400, 404]);

    // memberships hasMany is not exposed on the account resource
    const hidden = await get(client, `/accounts/${account.id}/memberships-nope`, user);

    assert.oneOf(hidden.status(), [400, 404]);
  });

  test('related endpoints require a session', async ({ client }) => {
    const { account } = await createNewAccount();

    const response = await get(client, `/accounts/${account.id}/admin`);

    response.assertStatus(401);
  });
});
