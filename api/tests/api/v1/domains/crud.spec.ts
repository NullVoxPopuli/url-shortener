import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import CustomDomain from '#models/custom_domain';
import { API_DOMAIN } from '#start/env';
import { createLink, createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { overridePlan } from '#services/plan_override';

const jsonHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

const addDomain = (client: ApiClient, user: User, hostname: string) =>
  client
    .post(`http://${API_DOMAIN}/v1/domains`)
    .json({ hostname })
    .headers(jsonHeaders)
    .withGuard('web')
    .loginAs(user);

const postLink = (client: ApiClient, user: User, body: Record<string, unknown>) =>
  client
    .post(`http://${API_DOMAIN}/v1/links`)
    .json(body)
    .headers(jsonHeaders)
    .withGuard('web')
    .loginAs(user);

test.group('Custom domains', (group) => {
  setup(group);

  test('plans without custom domains → 402', async ({ client }) => {
    const { user } = await createNewAccount();

    const response = await addDomain(client, user, 'links.example.com');

    response.assertStatus(402);
    assert.strictEqual(response.body().errors[0].title, 'Custom domain limit reached');
  });

  test('hobby plan can add up to 2 domains', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');

    const first = await addDomain(client, user, 'go.example.com');

    first.assertStatus(201);
    assert.strictEqual(first.body().data.attributes.hostname, 'go.example.com');

    (await addDomain(client, user, 'l.example.org')).assertStatus(201);
    (await addDomain(client, user, 'three.example.io')).assertStatus(402);
  });

  test('invalid + reserved hostnames are rejected', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');

    (await addDomain(client, user, 'not a hostname')).assertStatus(422);
    (await addDomain(client, user, 'https://example.com')).assertStatus(422);
    (await addDomain(client, user, 'nvp.local')).assertStatus(422);
    (await addDomain(client, user, 'sub.nvp.local')).assertStatus(422);
  });

  test('hostnames are globally unique', async ({ client }) => {
    const a = await createNewAccount();
    const b = await createNewAccount();

    await overridePlan(a.account, 'hobby');
    await overridePlan(b.account, 'hobby');

    (await addDomain(client, a.user, 'taken.example.com')).assertStatus(201);
    (await addDomain(client, b.user, 'taken.example.com')).assertStatus(422);
  });

  test('links can be created on an owned domain; shortUrl reflects it', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');

    const added = await addDomain(client, user, 'creation.example.com');

    added.assertStatus(201);

    const response = await postLink(client, user, {
      originalUrl: 'https://emberjs.com',
      domain: 'creation.example.com',
    });

    assert.strictEqual(response.status(), 201, JSON.stringify(response.body()));

    const attributes = response.body().data.attributes;

    assert.strictEqual(attributes.domain, 'creation.example.com');
    assert.ok(attributes.shortUrl.startsWith('https://creation.example.com/'));
  });

  test('links cannot be created on domains the account does not own', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');

    const response = await postLink(client, user, {
      originalUrl: 'https://emberjs.com',
      domain: 'not-mine.example.com',
    });

    response.assertStatus(422);
  });

  test('deleting a domain is admin + account scoped', async ({ client }) => {
    const { user, account } = await createNewAccount();
    const outsider = await createNewAccount();

    await overridePlan(account, 'hobby');

    const created = await addDomain(client, user, 'mine.example.com');
    const id = created.body().data.id;

    const foreign = await client
      .delete(`http://${API_DOMAIN}/v1/domains/${id}`)
      .headers(jsonHeaders)
      .withGuard('web')
      .loginAs(outsider.user);

    foreign.assertStatus(200);
    assert.isNotNull(await CustomDomain.find(id), 'silent no-op for outsiders');

    const own = await client
      .delete(`http://${API_DOMAIN}/v1/domains/${id}`)
      .headers(jsonHeaders)
      .withGuard('web')
      .loginAs(user);

    own.assertStatus(200);
    assert.isNull(await CustomDomain.find(id));
  });

  test('redirects are scoped by host', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'hobby');
    await addDomain(client, user, 'redirects.example.com');

    const onCustom = await createLink(user, account, {
      original: 'https://emberjs.com/custom',
      domain: 'redirects.example.com',
    });
    const onDefault = await createLink(user, account, 'https://emberjs.com/default');

    // custom-domain host resolves its own link
    const hit = await client
      .get(`/${onCustom.id}`)
      .headers({ Accept: 'text/html', Host: 'redirects.example.com' })
      .redirects(0);

    hit.assertStatus(308);
    hit.assertHeader('location', 'https://emberjs.com/custom');

    // ...but not a default-domain link
    const miss = await client
      .get(`/${onDefault.id}`)
      .headers({ Accept: 'text/html', Host: 'redirects.example.com' })
      .redirects(0);

    miss.assertStatus(404);

    // and the default domain does not serve custom-domain links
    const crossed = await client
      .get(`/${onCustom.id}`)
      .headers({ Accept: 'text/html', Host: 'nvp.local' })
      .redirects(0);

    crossed.assertStatus(404);
  });
});
