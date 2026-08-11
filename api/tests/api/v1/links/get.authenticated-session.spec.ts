import { test } from '@japa/runner';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import { createLink, createNewAccount } from '#tests/db';
import { API_DOMAIN } from '#start/env';
import { setup } from '#tests/helpers';

const get = (user: User, client: ApiClient, query = '') =>
  client
    .get(`http://${API_DOMAIN}/v1/links${query}`)
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
    response.assertBodyContains({
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

  test('?include=ownedBy,createdBy sideloads related resources, deduplicated', async ({
    client,
    assert,
  }) => {
    let { user, account } = await createNewAccount();
    await createLink(user, account);
    await createLink(user, account);
    let response = await get(user, client, '?include=ownedBy,createdBy');

    response.assertStatus(200);

    let body = response.body();

    assert.strictEqual(body.data.length, 2);
    // one account + one user across both links
    assert.strictEqual(body.included.length, 2);
    assert.deepEqual(body.included.map((r: any) => r.type).sort(), ['account', 'user']);

    // oauth secrets never serialize
    let included = body.included.find((r: any) => r.type === 'user');

    assert.notProperty(included.attributes, 'oauthGithubToken');
    assert.notProperty(included.attributes, 'oauth_github_token');

    // relationships carry linkage and links
    let link = body.data[0];

    assert.strictEqual(link.relationships.ownedBy.data.type, 'account');
    assert.ok(link.relationships.ownedBy.links.related);
  });

  test('unknown include paths and undeclared filters are strict 400s', async ({
    client,
    assert,
  }) => {
    let { user } = await createNewAccount();

    let badInclude = await get(user, client, '?include=bogus');

    badInclude.assertStatus(400);
    assert.strictEqual(badInclude.body().errors[0].source.parameter, 'include');

    let badFilter = await get(user, client, '?filter[original]=x');

    badFilter.assertStatus(400);
  });

  test('sorting and sparse fieldsets work without server code', async ({ client, assert }) => {
    let { user, account } = await createNewAccount();
    let first = await createLink(user, account, 'https://a.example.com/');
    let second = await createLink(user, account, 'https://b.example.com/');

    let sorted = await get(user, client, '?sort=-createdAt&fields[link]=original');

    sorted.assertStatus(200);

    let data = sorted.body().data;

    assert.deepEqual(data.map((l: any) => l.id).sort(), [first.id, second.id].sort());
    // sparse fieldset: only `original` remains
    assert.deepEqual(Object.keys(data[0].attributes), ['original']);
  });
});
