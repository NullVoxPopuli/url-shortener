import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import AccountMembership from '#models/account_membership';
import { API_DOMAIN } from '#start/env';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { assertUnauthorized } from '#tests/jsonapi';

const jsonHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

const switchTo = (client: ApiClient, accountId: string, user?: User) => {
  const request = client
    .post(`http://${API_DOMAIN}/v1/me/account`)
    .json({ accountId })
    .headers(jsonHeaders);

  return user ? request.withGuard('web').loginAs(user) : request;
};

test.group('POST /v1/me/account', (group) => {
  setup(group);

  test('unauthenticated → 401', async ({ client }) => {
    const { account } = await createNewAccount();

    assertUnauthorized(await switchTo(client, account.id));
  });

  test('switches between accounts the user belongs to', async ({ client }) => {
    const { user } = await createNewAccount();
    const other = await createNewAccount();

    await AccountMembership.ensure({ accountId: other.account.id, userId: user.id });

    const response = await switchTo(client, other.account.id, user);

    response.assertStatus(200);
    assert.strictEqual(response.body().data.id, other.account.id);

    await user.refresh();
    assert.strictEqual(user.account_id, other.account.id);
  });

  test('cannot switch to an account without membership', async ({ client }) => {
    const { user, account } = await createNewAccount();
    const other = await createNewAccount();

    const response = await switchTo(client, other.account.id, user);

    response.assertStatus(404);

    await user.refresh();
    assert.strictEqual(user.account_id, account.id);
  });
});
