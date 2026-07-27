import type { HttpContext } from '@adonisjs/core/http';
import env from '#start/env';
import { stripe } from '#services/stripe';
import { syncStripeDataToAccountByCustomerId } from '#services/stripe_sync';

const allowedEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.upcoming',
  'invoice.marked_uncollectible',
  'invoice.payment_succeeded',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'subscription_schedule.updated',
  'subscription_schedule.canceled',
  'subscription_schedule.released',
]);

export default class StripeWebhookController {
  async handle({ request, response }: HttpContext) {
    const signature = request.header('stripe-signature');

    if (!signature) {
      response.status(400);
      return response.json({ error: 'Missing Stripe-Signature header' });
    }

    /**
     * The bodyparser retains the raw JSON string (and enforces its 1mb
     * size limit) before this controller runs; signature verification
     * needs those exact bytes.
     */
    const body = request.raw();

    if (!body) {
      response.status(400);
      return response.json({ error: 'Missing body' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, env.get('STRIPE_WEBHOOK_SECRET'));
    } catch (error) {
      console.error('[STRIPE HOOK] Signature verification failed', error);
      response.status(400);
      return response.json({ error: 'Invalid signature' });
    }

    // Ack quickly; do minimal work.
    if (!allowedEvents.has(event.type)) {
      return response.json({ received: true });
    }

    const customerId = (event.data.object as { customer?: unknown })?.customer;

    if (typeof customerId !== 'string') {
      // Not an event we can sync from.
      return response.json({ received: true });
    }

    // Await the sync (one Stripe API call + one DB write) so that a failure
    // can be reported to Stripe as a 500 — that is what makes Stripe retry.
    // A fire-and-forget that acks 200 would silently drop failed syncs.
    try {
      await syncStripeDataToAccountByCustomerId(customerId);
    } catch (error) {
      console.error(`[STRIPE HOOK] Error processing ${event.type}`, error);
      response.status(500);
      return response.json({ error: 'Sync failed' });
    }

    return response.json({ received: true });
  }
}
