import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import { API_DOMAIN } from '#start/env';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { assertUnauthorized, hasLinkedRelationship } from '#tests/jsonapi';

const getAccount = (client: ApiClient, id: string, user?: User) => {
  const request = client
    .get(`http://${API_DOMAIN}/v1/accounts/${id}`)
    .header('Accept', 'application/vnd.api+json');

  return user ? request.withGuard('web').loginAs(user) : request;
};

test.group('GET /v1/accounts/:id', (group) => {
  setup(group);

  test('unauthenticated → 401', async ({ client }) => {
    const { account } = await createNewAccount();
    const response = await getAccount(client, account.id);

    assertUnauthorized(response);
  });

  test('shows the own account, without billing internals', async ({ client }) => {
    const { user, account } = await createNewAccount();
    const response = await getAccount(client, account.id, user);

    response.assertStatus(200);

    const data = response.body().data;

    assert.strictEqual(data.type, 'account');
    assert.strictEqual(data.id, account.id);
    assert.strictEqual(data.attributes.name, account.name);
    assert.notProperty(data.attributes, 'stripeCustomerId');
    assert.notProperty(data.attributes, 'stripeSubscriptionId');

    hasLinkedRelationship(data, 'admin', 'user');
  });

  test("another account is a 404, as if it didn't exist", async ({ client }) => {
    const { user } = await createNewAccount();
    const other = await createNewAccount();

    const response = await getAccount(client, other.account.id, user);

    response.assertStatus(404);
  });
});
