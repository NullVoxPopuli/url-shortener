import Stripe from 'stripe';
import env from '#start/env';

/**
 * Stripe client (server-side).
 *
 * Note: we intentionally avoid spreading Stripe calls throughout the codebase.
 * See `syncStripeDataToAccount*` for the one place we "interpret" Stripe state.
 */
export const stripe = new Stripe(env.get('STRIPE_SECRET_KEY'), {
  // Keep this explicit so payload shapes don’t drift unexpectedly.
  // If you change it, also update your Stripe webhook endpoint version.
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});
