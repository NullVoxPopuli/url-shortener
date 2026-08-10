import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import db from '@adonisjs/lucid/services/db';
import type User from '#models/user';
import AccountMembership from '#models/account_membership';
import { API_DOMAIN } from '#start/env';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { linkDoc } from '#tests/jsonapi';
import { overridePlan } from '#services/plan_override';

const jsonHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

const listKeys = (client: ApiClient, user: User) =>
  client
    .get(`http://${API_DOMAIN}/v1/api-keys`)
    .headers(jsonHeaders)
    .withGuard('web')
    .loginAs(user);

const createKey = (client: ApiClient, user: User, body: Record<string, unknown>) =>
  client
    .post(`http://${API_DOMAIN}/v1/api-keys`)
    .json(body)
    .headers(jsonHeaders)
    .withGuard('web')
    .loginAs(user);

const revokeKey = (client: ApiClient, user: User, id: string) =>
  client
    .delete(`http://${API_DOMAIN}/v1/api-keys/${id}`)
    .headers(jsonHeaders)
    .withGuard('web')
    .loginAs(user);

test.group('API keys: management', (group) => {
  setup(group);

  test('plans without API keys → 402', async ({ client }) => {
    const { user } = await createNewAccount();

    const response = await createKey(client, user, {
      name: 'CI deploys',
      scopes: ['links:read'],
    });

    response.assertStatus(402);
    assert.strictEqual(response.body().errors[0].title, 'API key limit reached');
  });

  test('side-hobby also has no API keys', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'side-hobby');

    const response = await createKey(client, user, {
      name: 'CI deploys',
      scopes: ['links:read'],
    });

    response.assertStatus(402);
  });

  test('hobby gets 1 key; project gets 3', async ({ client }) => {
    const hobby = await createNewAccount();

    await overridePlan(hobby.account, 'hobby');

    const first = await createKey(client, hobby.user, { name: 'one', scopes: ['links:read'] });
    const second = await createKey(client, hobby.user, { name: 'two', scopes: ['links:read'] });

    first.assertStatus(201);
    second.assertStatus(402);

    const project = await createNewAccount();

    await overridePlan(project.account, 'project');

    for (const name of ['one', 'two', 'three']) {
      const response = await createKey(client, project.user, {
        name,
        scopes: ['links:read'],
      });

      response.assertStatus(201);
    }

    const fourth = await createKey(client, project.user, {
      name: 'four',
      scopes: ['links:read'],
    });

    fourth.assertStatus(402);
  });

  test('the secret is only in the create response', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');

    const created = await createKey(client, user, {
      name: 'CI deploys',
      scopes: ['links:read', 'links:write'],
    });

    created.assertStatus(201);

    const attributes = created.body().data.attributes;

    assert.ok(attributes.token.startsWith('nvp_'), 'secret uses the nvp_ prefix');
    assert.strictEqual(attributes.name, 'CI deploys');
    assert.sameMembers(attributes.scopes, ['links:read', 'links:write']);

    const listed = await listKeys(client, user);

    listed.assertStatus(200);

    const body = listed.body();

    assert.strictEqual(body.data.length, 1);
    assert.notProperty(body.data[0].attributes, 'token');
    assert.deepInclude(body.meta, { limit: 1, used: 1, remaining: 0 });
  });

  test('invalid input → 422', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');

    const cases: Record<string, unknown>[] = [
      { scopes: ['links:read'] }, // no name
      { name: 'x'.repeat(101), scopes: ['links:read'] },
      { name: 'ok' }, // no scopes
      { name: 'ok', scopes: [] },
      { name: 'ok', scopes: ['links:admin'] },
      { name: 'ok', scopes: ['links:read'], expiresInDays: 0 },
      { name: 'ok', scopes: ['links:read'], expiresInDays: 1.5 },
      { name: 'ok', scopes: ['links:read'], expiresInDays: 99999 },
    ];

    for (const body of cases) {
      const response = await createKey(client, user, body);

      response.assertStatus(422);
    }
  });

  test('revoking is 404 when there is nothing to revoke', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');

    const created = await createKey(client, user, { name: 'gone', scopes: ['links:read'] });
    const id = created.body().data.id;

    const revoked = await revokeKey(client, user, id);

    revoked.assertStatus(200);

    const again = await revokeKey(client, user, id);

    again.assertStatus(404);

    const listed = await listKeys(client, user);

    assert.strictEqual(listed.body().data.length, 0);
  });

  test('another user cannot revoke my key', async ({ client }) => {
    const mine = await createNewAccount();
    const other = await createNewAccount();

    await overridePlan(mine.account, 'hobby');
    await overridePlan(other.account, 'hobby');

    const created = await createKey(client, mine.user, { name: 'mine', scopes: ['links:read'] });
    const id = created.body().data.id;

    const foreign = await revokeKey(client, other.user, id);

    foreign.assertStatus(404);

    const listed = await listKeys(client, mine.user);

    assert.strictEqual(listed.body().data.length, 1, 'the key survives');
  });

  test('expired keys do not count against the quota', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');

    const created = await createKey(client, user, {
      name: 'short-lived',
      scopes: ['links:read'],
      expiresInDays: 1,
    });

    created.assertStatus(201);

    await db
      .from('api_keys')
      .where('id', Number(created.body().data.id))
      .update({ expires_at: new Date(Date.now() - 60_000) });

    const next = await createKey(client, user, { name: 'fresh', scopes: ['links:read'] });

    next.assertStatus(201);
  });

  test('management requires a session', async ({ client }) => {
    const response = await client.get(`http://${API_DOMAIN}/v1/api-keys`).headers(jsonHeaders);

    response.assertStatus(401);
  });
});

test.group('API keys: bearer authentication', (group) => {
  setup(group);

  async function makeKey(client: ApiClient, user: User, scopes: string[]) {
    const created = await createKey(client, user, { name: 'test key', scopes });

    created.assertStatus(201);

    return created.body().data.attributes.token as string;
  }

  test('links:read can list, but not create', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'project');

    const token = await makeKey(client, user, ['links:read']);

    const listed = await client
      .get(`http://${API_DOMAIN}/v1/links`)
      .headers(jsonHeaders)
      .bearerToken(token);

    listed.assertStatus(200);

    const created = await client
      .post(`http://${API_DOMAIN}/v1/links`)
      .json(linkDoc({ originalUrl: 'https://emberjs.com' }))
      .headers(jsonHeaders)
      .bearerToken(token);

    created.assertStatus(403);
  });

  test('links:write can create and delete', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'project');

    const token = await makeKey(client, user, ['links:write']);

    const created = await client
      .post(`http://${API_DOMAIN}/v1/links`)
      .json(linkDoc({ originalUrl: 'https://emberjs.com' }))
      .headers(jsonHeaders)
      .bearerToken(token);

    created.assertStatus(201);

    const deleted = await client
      .delete(`http://${API_DOMAIN}/v1/links/${created.body().data.id}`)
      .headers(jsonHeaders)
      .bearerToken(token);

    deleted.assertStatus(200);
  });

  test('garbage and revoked keys → 401', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');

    const garbage = await client
      .get(`http://${API_DOMAIN}/v1/links`)
      .headers(jsonHeaders)
      .bearerToken('nvp_notarealkey');

    garbage.assertStatus(401);

    const created = await createKey(client, user, { name: 'doomed', scopes: ['links:read'] });
    const token = created.body().data.attributes.token as string;

    await revokeKey(client, user, created.body().data.id);

    const revoked = await client
      .get(`http://${API_DOMAIN}/v1/links`)
      .headers(jsonHeaders)
      .bearerToken(token);

    revoked.assertStatus(401);
  });

  test('a key is pinned to its account', async ({ client }) => {
    const { user, account } = await createNewAccount();
    const other = await createNewAccount();

    await overridePlan(account, 'hobby');

    const token = await makeKey(client, user, ['links:read']);

    const crossAccount = await client
      .get(`http://${API_DOMAIN}/v1/links?accountId=${other.account.id}`)
      .headers(jsonHeaders)
      .bearerToken(token);

    crossAccount.assertStatus(404);

    const own = await client
      .get(`http://${API_DOMAIN}/v1/links?accountId=${account.id}`)
      .headers(jsonHeaders)
      .bearerToken(token);

    own.assertStatus(200);
  });

  test('removing the membership revokes its keys', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');

    const token = await makeKey(client, user, ['links:read']);

    const membership = await AccountMembership.query()
      .where('account_id', account.id)
      .where('user_id', user.id)
      .firstOrFail();

    await membership.delete();

    const response = await client
      .get(`http://${API_DOMAIN}/v1/links`)
      .headers(jsonHeaders)
      .bearerToken(token);

    response.assertStatus(401);
  });
});
