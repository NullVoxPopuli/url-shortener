import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import { API_DOMAIN } from '#start/env';
import env from '#start/env';
import { stripe } from '#services/stripe';
import { setup } from '#tests/helpers';

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
});
