import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import { API_DOMAIN } from '#start/env';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { assertUnauthorized } from '#tests/jsonapi';

const getStatus = (client: ApiClient, user?: User) => {
  const request = client
    .get(`http://${API_DOMAIN}/v1/billing/status`)
    .header('Accept', 'application/vnd.api+json');

  return user ? request.loginAs(user) : request;
};

const postCheckout = (client: ApiClient, user?: User) => {
  const request = client
    .post(`http://${API_DOMAIN}/v1/billing/checkout`)
    .header('Accept', 'application/vnd.api+json')
    .header('Content-Type', 'application/vnd.api+json');

  return user ? request.loginAs(user) : request;
};

test.group('GET /v1/billing/status', (group) => {
  setup(group);

  test('unauthenticated → 401', async ({ client }) => {
    const response = await getStatus(client);

    assertUnauthorized(response);
  });

  test('a fresh account has no subscription', async ({ client }) => {
    const { user } = await createNewAccount();
    const response = await getStatus(client, user);

    response.assertStatus(200);

    const attributes = response.body().data.attributes;
    assert.isFalse(attributes.hasActiveSubscription);
    assert.isNull(attributes.stripe.customerId);
    assert.isNull(attributes.stripe.subscriptionStatus);
  });

  test('an account with an active subscription reports it', async ({ client }) => {
    const { user } = await createNewAccount({
      account: {
        stripeCustomerId: 'cus_test_123',
        stripeSubscriptionId: 'sub_test_123',
        stripeSubscriptionStatus: 'active',
      },
    });
    const response = await getStatus(client, user);

    response.assertStatus(200);

    const attributes = response.body().data.attributes;
    assert.isTrue(attributes.hasActiveSubscription);
    assert.strictEqual(attributes.stripe.subscriptionStatus, 'active');
  });
});

test.group('POST /v1/billing/checkout', (group) => {
  setup(group);

  test('unauthenticated → 401', async ({ client }) => {
    const response = await postCheckout(client);

    assertUnauthorized(response);
  });

  test('an already-subscribed account → 409, without calling Stripe', async ({ client }) => {
    const { user } = await createNewAccount({
      account: { stripeSubscriptionStatus: 'active' },
    });
    const response = await postCheckout(client, user);

    response.assertStatus(409);
  });
});
