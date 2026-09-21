import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import { API_DOMAIN } from '#start/env';
import { DateTime } from 'luxon';
import { createLink, createNewAccount } from '#tests/db';
import LinkEdit from '#models/link_edit';
import { PLANS } from '#services/plans';
import { glimdownOwner } from '#consts';
import AccountMembership from '#models/account_membership';
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

    // plan + usage are top-level attributes (not nested in stripe)
    assert.strictEqual(attributes.plan.key, 'none');
    assert.strictEqual(attributes.plan.monthlyLinkLimit, 5);
    assert.strictEqual(attributes.usage.used, 0);
    assert.strictEqual(attributes.usage.remaining, 5);
    assert.ok(attributes.usage.periodStart);
    assert.ok(attributes.usage.periodEnd);
    assert.isNull(attributes.stripe.interval);
    assert.isNull(attributes.pendingDowngrade);
    assert.notProperty(attributes, 'availablePlans');
  });

  test('usage counts links created this period', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await createLink(user, account, 'https://example.com/1');
    await createLink(user, account, 'https://example.com/2');

    const response = await getStatus(client, user);
    const attributes = response.body().data.attributes;

    assert.strictEqual(attributes.usage.used, 2);
    assert.strictEqual(attributes.usage.remaining, 3);
  });

  test('a legacy free account is unlimited', async ({ client }) => {
    const { user } = await createNewAccount({ account: { isFree: true } });

    const response = await getStatus(client, user);
    const attributes = response.body().data.attributes;

    assert.strictEqual(attributes.plan.key, 'free');
    assert.isNull(attributes.plan.monthlyLinkLimit);
    assert.isNull(attributes.usage.remaining);
    assert.isFalse(attributes.isGlimdown);
  });

  test('the glimdown account says so', async ({ client }) => {
    // seeded for every test run; a member reads its status through ?accountId=
    const { user } = await createNewAccount();

    await AccountMembership.ensure({ accountId: glimdownOwner.id, userId: user.id, role: 'admin' });

    const response = await client
      .get(`http://${API_DOMAIN}/v1/billing/status?accountId=${glimdownOwner.id}`)
      .header('Accept', 'application/vnd.api+json')
      .loginAs(user);
    const attributes = response.body().data.attributes;

    response.assertStatus(200);
    assert.isTrue(attributes.isGlimdown);
    assert.strictEqual(attributes.plan.key, 'free');
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

test.group('GET /v1/billing/status [downgrade in progress]', (group) => {
  setup(group);

  test('reports the plan paid for, the plan it drops to, and the overages', async ({ client }) => {
    const now = Math.floor(Date.now() / 1000);
    const { user, account } = await createNewAccount({
      account: {
        stripeCustomerId: 'cus_downgrading',
        stripeSubscriptionStatus: 'active',
        stripePriceId: PLANS[0].prices.month.id,
        stripeDowngradedFromPriceId: PLANS[2].prices.month.id,
        stripeDowngradedUntil: now + 1000,
      },
    });

    for (let i = 0; i < PLANS[0].monthlyLinkLimit; i++) {
      await createLink(user, account, `https://example.com/${i}`);
    }

    // one more, with an expiration: Base has no link expiration
    const expiring = await createLink(user, account, {
      original: 'https://example.com/expiring',
      expiresAt: DateTime.utc().plus({ days: 7 }),
    });

    // one edit this month: Base has no edits
    await LinkEdit.create({
      link_id: expiring.id,
      account_id: account.id,
      edited_by: user.id,
      previousOriginal: 'https://example.com/before',
      previousExpiresAt: null,
    });

    const response = await getStatus(client, user);
    const attributes = response.body().data.attributes;

    assert.strictEqual(attributes.plan.key, 'pro');
    assert.strictEqual(attributes.pendingDowngrade.plan.key, 'base');
    assert.strictEqual(attributes.pendingDowngrade.at, now + 1000);
    assert.deepEqual(attributes.pendingDowngrade.overages, [
      { resource: 'links', used: PLANS[0].monthlyLinkLimit + 1, limit: PLANS[0].monthlyLinkLimit },
      { resource: 'linkEdits', used: 1, limit: 0 },
      { resource: 'expiringLinks', used: 1, limit: 0 },
    ]);
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
