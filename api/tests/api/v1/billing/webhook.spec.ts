import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import { API_DOMAIN } from '#start/env';
import env from '#start/env';
import { stripe } from '#services/stripe';
import StripeWebhookEvent from '#models/stripe_webhook_event';
import Account from '#models/account';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';

/**
 * Stand in for Stripe's subscription list for the duration of one test.
 */
async function withSubscriptionList<T>(
  list: () => Promise<{ data: object[] }>,
  run: () => Promise<T>
) {
  const original = stripe.subscriptions.list;

  stripe.subscriptions.list = list as unknown as typeof original;

  try {
    return await run();
  } finally {
    stripe.subscriptions.list = original;
  }
}

const WEBHOOK_URL = `http://${API_DOMAIN}/stripe/webhook`;

/**
 * Sign the exact bytes superagent will put on the wire
 * (its JSON serializer is JSON.stringify).
 */
function signedPost(client: ApiClient, event: object) {
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: JSON.stringify(event),
    secret: env.get('STRIPE_WEBHOOK_SECRET'),
  });

  return client.post(WEBHOOK_URL).header('stripe-signature', signature).json(event);
}

test.group('POST /stripe/webhook', (group) => {
  setup(group);

  test('without a signature header → 400', async ({ client }) => {
    const response = await client.post(WEBHOOK_URL).json({ type: 'invoice.paid' });

    response.assertStatus(400);
  });

  test('with an invalid signature → 400', async ({ client }) => {
    const response = await client
      .post(WEBHOOK_URL)
      .header('stripe-signature', 't=1,v1=deadbeef')
      .json({ type: 'invoice.paid' });

    response.assertStatus(400);
  });

  test('with a valid signature, but an event type we do not track → acked and ignored', async ({
    client,
  }) => {
    const response = await signedPost(client, {
      id: 'evt_test_1',
      type: 'product.created',
      data: { object: { id: 'prod_123' } },
    });

    response.assertStatus(200);
    assert.deepEqual(response.body(), { received: true });
  });

  test('with a tracked event for an unknown customer → acked (nothing to sync)', async ({
    client,
  }) => {
    const response = await signedPost(client, {
      id: 'evt_test_2',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_123', customer: 'cus_does_not_exist' } },
    });

    response.assertStatus(200);
    assert.deepEqual(response.body(), { received: true });
  });

  test('with a tracked event missing a customer id → acked and ignored', async ({ client }) => {
    const response = await signedPost(client, {
      id: 'evt_test_3',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123', customer: null } },
    });

    response.assertStatus(200);
    assert.deepEqual(response.body(), { received: true });
  });

  test('duplicate deliveries are deduped by event id', async ({ client }) => {
    const event = {
      id: 'evt_test_duplicate_1',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_123', customer: 'cus_does_not_exist' } },
    };

    const first = await signedPost(client, event);
    const second = await signedPost(client, event);

    first.assertStatus(200);
    second.assertStatus(200);

    assert.deepEqual(first.body(), { received: true });
    assert.deepEqual(second.body(), { received: true });

    const rows = await StripeWebhookEvent.query().where('event_id', event.id);
    assert.lengthOf(rows, 1);
    assert.strictEqual(rows[0]?.eventType, event.type);
  });

  test('a tracked event for a known customer syncs the account', async ({ client }) => {
    const { account } = await createNewAccount({ account: { stripeCustomerId: 'cus_known' } });
    const event = {
      id: 'evt_test_sync_1',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', customer: 'cus_known' } },
    };

    const response = await withSubscriptionList(
      async () => ({
        data: [
          {
            id: 'sub_1',
            status: 'active',
            cancel_at_period_end: true,
            cancel_at: null,
            default_payment_method: null,
            items: { data: [{ price: { id: 'price_1' } }] },
          },
        ],
      }),
      () => signedPost(client, event)
    );

    response.assertStatus(200);

    const fresh = await Account.findOrFail(account.id);
    assert.strictEqual(fresh.stripeSubscriptionId, 'sub_1');
    assert.isTrue(fresh.stripeCancelAtPeriodEnd);
  });

  test('a failed sync → 500, and the same event is processed again on retry', async ({
    client,
  }) => {
    const { account } = await createNewAccount({ account: { stripeCustomerId: 'cus_flaky' } });
    const event = {
      id: 'evt_test_retry_1',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', customer: 'cus_flaky' } },
    };

    const failed = await withSubscriptionList(
      async () => {
        throw new Error('Stripe is down');
      },
      () => signedPost(client, event)
    );

    failed.assertStatus(500);
    assert.lengthOf(await StripeWebhookEvent.query().where('event_id', event.id), 0);

    const retried = await withSubscriptionList(
      async () => ({
        data: [
          {
            id: 'sub_1',
            status: 'active',
            cancel_at_period_end: false,
            cancel_at: null,
            default_payment_method: null,
            items: { data: [{ price: { id: 'price_1' } }] },
          },
        ],
      }),
      () => signedPost(client, event)
    );

    retried.assertStatus(200);
    assert.lengthOf(await StripeWebhookEvent.query().where('event_id', event.id), 1);

    const fresh = await Account.findOrFail(account.id);
    assert.strictEqual(fresh.stripeSubscriptionId, 'sub_1');
  });
});
