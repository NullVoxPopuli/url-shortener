import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import { API_DOMAIN } from '#start/env';
import { createLink, createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';

const get = (user: User, client: ApiClient, query = '') =>
  client
    .get(`http://${API_DOMAIN}/v1/links${query}`)
    .header('Accept', 'application/vnd.api+json')
    .loginAs(user);

test.group('GET /v1/links [pagination]', (group) => {
  setup(group);

  test('a page carries its size, total, and the relational links', async ({ client }) => {
    let { user, account } = await createNewAccount();

    for (let i = 0; i < 5; i++) {
      await createLink(user, account, `https://example.com/${i}`);
    }

    let response = await get(user, client, '?page[size]=2');

    response.assertStatus(200);

    let body = response.body();
    assert.lengthOf(body.data, 2);
    assert.deepEqual(body.meta.page, { number: 1, size: 2, total: 5, lastPage: 3 });
    assert.isNull(body.links.prev);
    assert.include(decodeURIComponent(body.links.next), 'page[number]=2');
    assert.include(decodeURIComponent(body.links.last), 'page[number]=3');
  });

  test('pages do not overlap and the last page is short', async ({ client }) => {
    let { user, account } = await createNewAccount();

    for (let i = 0; i < 5; i++) {
      await createLink(user, account, `https://example.com/${i}`);
    }

    let seen = new Set<string>();

    for (let number = 1; number <= 3; number++) {
      let response = await get(user, client, `?page[size]=2&page[number]=${number}`);
      let ids = response.body().data.map((link: { id: string }) => link.id) as string[];

      ids.forEach((id) => seen.add(id));

      assert.lengthOf(ids, number === 3 ? 1 : 2);
    }

    assert.strictEqual(seen.size, 5);
  });

  test('a page past the end is empty, not an error', async ({ client }) => {
    let { user, account } = await createNewAccount();

    await createLink(user, account);

    let response = await get(user, client, '?page[number]=9');

    response.assertStatus(200);
    assert.lengthOf(response.body().data, 0);
  });
});
