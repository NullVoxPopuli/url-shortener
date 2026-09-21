import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import AccountMembership from '#models/account_membership';
import type User from '#models/user';
import { API_DOMAIN } from '#start/env';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { assertUnauthorized } from '#tests/jsonapi';

const getHistory = (client: ApiClient, user?: User, accountId?: string) => {
  const query = accountId ? `?accountId=${accountId}` : '';
  const request = client
    .get(`http://${API_DOMAIN}/v1/billing/history${query}`)
    .header('Accept', 'application/vnd.api+json');

  return user ? request.loginAs(user) : request;
};

test.group('GET /v1/billing/history', (group) => {
  setup(group);

  test('unauthenticated → 401', async ({ client }) => {
    const response = await getHistory(client);

    assertUnauthorized(response);
  });

  test('an account that never reached Stripe has empty history, without calling Stripe', async ({
    client,
  }) => {
    const { user, account } = await createNewAccount();
    const response = await getHistory(client, user);

    response.assertStatus(200);

    const { data } = response.body();
    assert.strictEqual(data.type, 'billing-history');
    assert.strictEqual(data.id, account.id);
    assert.deepEqual(data.attributes.subscriptions, []);
    assert.deepEqual(data.attributes.invoices, []);
    assert.deepEqual(data.attributes.events, []);
  });

  test('a non-admin member → 403', async ({ client }) => {
    const { account } = await createNewAccount();
    const { user: member } = await createNewAccount();

    await AccountMembership.ensure({ accountId: account.id, userId: member.id, role: 'member' });

    const response = await getHistory(client, member, account.id);

    response.assertStatus(403);
  });
});
