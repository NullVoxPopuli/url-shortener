import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import { API_DOMAIN } from '#start/env';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { assertUnauthorized, hasLinkedRelationship } from '#tests/jsonapi';

const getUser = (client: ApiClient, id: string, user?: User) => {
  const request = client
    .get(`http://${API_DOMAIN}/v1/users/${id}`)
    .header('Accept', 'application/vnd.api+json');

  return user ? request.withGuard('web').loginAs(user) : request;
};

test.group('GET /v1/users/:id', (group) => {
  setup(group);

  test('unauthenticated → 401', async ({ client }) => {
    const { user } = await createNewAccount();
    const response = await getUser(client, user.id);

    assertUnauthorized(response);
  });

  test('shows the own user, without oauth internals', async ({ client }) => {
    const { user } = await createNewAccount();
    const response = await getUser(client, user.id, user);

    response.assertStatus(200);

    const data = response.body().data;

    assert.strictEqual(data.type, 'user');
    assert.strictEqual(data.id, user.id);
    assert.strictEqual(data.attributes.name, user.name);
    assert.notProperty(data.attributes, 'oauth_github_id');
    assert.notProperty(data.attributes, 'oauth_github_token');

    hasLinkedRelationship(data, 'account', 'account');
  });

  test("another account's user is a 404, as if it didn't exist", async ({ client }) => {
    const { user } = await createNewAccount();
    const other = await createNewAccount();

    const response = await getUser(client, other.user.id, user);

    response.assertStatus(404);
  });
});
