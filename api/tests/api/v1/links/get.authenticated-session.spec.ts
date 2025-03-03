import { test } from '@japa/runner';
import { ApiClient } from '@japa/api-client';
import User from '#models/user';
import { createLink, createNewAccount } from '#tests/db';
import { API_DOMAIN } from '#start/env';
import { setup } from '#tests/helpers';

const get = (user: User, client: ApiClient) =>
  client
    .get(`http://${API_DOMAIN}/v1/links`)
    .header('Accept', 'application/vnd.api+json')
    .loginAs(user);

test.group('GET [authenticated session]', (group) => {
  setup(group);

  test('default endpoint returns a list (which is empty because there are no links)', async ({
    client,
  }) => {
    let { user } = await createNewAccount();
    let response = await get(user, client);

    response.assertStatus(200);
    response.assertBody({
      included: [],
      links: [],
      data: [],
    });
  });

  test('default endpoint returns a list (with data)', async ({ client, assert }) => {
    let { user, account } = await createNewAccount();
    await createLink(user, account);
    await createLink(user, account);
    let response = await get(user, client);

    response.assertStatus(200);

    let data = response.body().data;

    assert.strictEqual(data.length, 2);
  });
});
