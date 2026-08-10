import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import AccountMembership from '#models/account_membership';
import { API_DOMAIN } from '#start/env';
import { createLink, createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';

const jsonHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

const listLinks = (client: ApiClient, user: User, accountId?: string) =>
  client
    .get(`http://${API_DOMAIN}/v1/links${accountId ? `?accountId=${accountId}` : ''}`)
    .headers(jsonHeaders)
    .withGuard('web')
    .loginAs(user);

test.group('Account context (?accountId=)', (group) => {
  setup(group);

  test('defaults to the personal account', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await createLink(user, account, 'https://example.com/mine');

    const response = await listLinks(client, user);

    response.assertStatus(200);
    assert.strictEqual(response.body().data.length, 1);
  });

  test('operates on another account when the caller is a member', async ({ client }) => {
    const { user } = await createNewAccount();
    const team = await createNewAccount({ account: { isFree: true } });

    await AccountMembership.ensure({ accountId: team.account.id, userId: user.id });
    await createLink(team.user, team.account, 'https://example.com/theirs');

    const scoped = await listLinks(client, user, team.account.id);

    scoped.assertStatus(200);
    assert.strictEqual(scoped.body().data.length, 1);

    // personal view stays empty
    const personal = await listLinks(client, user);

    personal.assertStatus(200);
    assert.strictEqual(personal.body().data.length, 0);
  });

  test('non-membership account contexts are a 404', async ({ client }) => {
    const { user } = await createNewAccount();
    const other = await createNewAccount();

    const response = await listLinks(client, user, other.account.id);

    response.assertStatus(404);
  });

  test('billing status follows the account context', async ({ client }) => {
    const { user } = await createNewAccount();
    const team = await createNewAccount({ account: { isFree: true } });

    await AccountMembership.ensure({ accountId: team.account.id, userId: user.id });

    const response = await client
      .get(`http://${API_DOMAIN}/v1/billing/status?accountId=${team.account.id}`)
      .headers(jsonHeaders)
      .withGuard('web')
      .loginAs(user);

    response.assertStatus(200);
    assert.strictEqual(response.body().data.id, team.account.id);
    assert.strictEqual(response.body().data.attributes.plan.key, 'free');
  });
});
