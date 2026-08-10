import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import { API_DOMAIN } from '#start/env';
import { createLink, createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { linkDoc } from '#tests/jsonapi';
import { NO_SUBSCRIPTION_PLAN } from '#services/plans';

const post = (user: User, client: ApiClient, body = {}) =>
  client
    .post(`http://${API_DOMAIN}/v1/links`)
    .json(linkDoc(body))
    .header('Accept', 'application/vnd.api+json')
    .header('Content-Type', 'application/vnd.api+json')
    .withGuard('web')
    .loginAs(user);

test.group('POST /v1/links [quota]', (group) => {
  setup(group);

  test('an account under its limit can create', async ({ client }) => {
    let { user } = await createNewAccount();

    let response = await post(user, client, { originalUrl: 'https://emberjs.com' });

    response.assertStatus(201);
  });

  test('an account at its limit gets a 402', async ({ client }) => {
    let { user, account } = await createNewAccount();

    for (let i = 0; i < NO_SUBSCRIPTION_PLAN.monthlyLinkLimit; i++) {
      await createLink(user, account, `https://example.com/${i}`);
    }

    let response = await post(user, client, { originalUrl: 'https://emberjs.com' });

    response.assertStatus(402);

    let { errors } = response.body();

    assert.strictEqual(errors[0].status, '402');
    assert.strictEqual(errors[0].detail, 'Monthly link limit reached');
  });

  test('a free (unlimited) account is never limited', async ({ client }) => {
    let { user, account } = await createNewAccount({ account: { isFree: true } });

    for (let i = 0; i < NO_SUBSCRIPTION_PLAN.monthlyLinkLimit; i++) {
      await createLink(user, account, `https://example.com/${i}`);
    }

    let response = await post(user, client, { originalUrl: 'https://emberjs.com' });

    response.assertStatus(201);
  });
});
