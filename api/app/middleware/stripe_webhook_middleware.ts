import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
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
]);

function pathname(url: string) {
  return url.split('?')[0];
}

async function readRawBody(ctx: HttpContext): Promise<Buffer> {
  // NOTE: This middleware is mounted in the *server* middleware stack, so
  // the body parser has not run yet.
  const req: any = (ctx.request as any).request;

  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default class StripeWebhookMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Only handle our webhook route.
    if (ctx.request.method() !== 'POST') return next();

    // This is the public URL you’ll configure in Stripe.
    if (pathname(ctx.request.url()) !== '/stripe/webhook') return next();

    const signature = ctx.request.header('stripe-signature');

    if (!signature) {
      ctx.response.status(400);
      return ctx.response.json({ error: 'Missing Stripe-Signature header' });
    }

    const body = await readRawBody(ctx);

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, env.get('STRIPE_WEBHOOK_SECRET'));
    } catch (error) {
      console.error('[STRIPE HOOK] Signature verification failed', error);
      ctx.response.status(400);
      return ctx.response.json({ error: 'Invalid signature' });
    }

    // Ack quickly; do minimal work.
    if (!allowedEvents.has(event.type)) {
      return ctx.response.json({ received: true });
    }

    const customerId = (event.data.object as any)?.customer;

    if (typeof customerId !== 'string') {
      // Not an event we can sync from.
      return ctx.response.json({ received: true });
    }

    try {
      await syncStripeDataToAccountByCustomerId(customerId);
    } catch (error) {
      // Webhooks will be retried by Stripe; still return 200 to avoid loops.
      console.error('[STRIPE HOOK] Error processing event', error);
    }

    return ctx.response.json({ received: true });
  }
}
