import type { HttpContext } from '@adonisjs/core/http';
import env from '#start/env';
import { DOMAIN } from '#start/env';
import Account from '#models/account';
import { syncStripeDataToAccount } from '#services/stripe_sync';
import { action } from '../base.js';
import { billingCheckout, billingPortal, billingStatus } from './actions/billing.js';

/**
 * Guard against open-redirect attacks by only allowing redirects to
 * our own domain or relative paths.
 */
export function isSafeRedirect(url: string): boolean {
  // Relative paths are always safe — but `//evil.com` (and `/\evil.com` in
  // some browsers) are scheme-relative URLs, not paths.
  if (url.startsWith('/')) return !url.startsWith('//') && !url.startsWith('/\\');

  try {
    const parsed = new URL(url);
    return parsed.hostname === DOMAIN || parsed.hostname.endsWith(`.${DOMAIN}`);
  } catch {
    return false;
  }
}

export default class BillingController {
  /**
   * Create a Stripe Checkout session.
   */
  async checkout(context: HttpContext) {
    return action(context, billingCheckout);
  }

  /**
   * Users often return before webhooks arrive. Sync eagerly.
   *
   * Not an `action()` — this is a browser navigation target (Stripe
   * redirects here), so it always redirects, never renders errors.
   */
  async success({ auth, response, request }: HttpContext) {
    const fallback = env.get('STRIPE_CANCEL_URL');
    const candidate = request.input('return_to');
    const returnTo = candidate && isSafeRedirect(candidate) ? candidate : fallback;

    try {
      await auth.authenticateUsing(['web', 'api']);
    } catch {
      return response.redirect(returnTo);
    }

    const user = auth.user;
    if (!user) return response.redirect(returnTo);

    const account = await Account.find(user.account_id);
    if (!account) return response.redirect(returnTo);

    if (account.stripeCustomerId) {
      try {
        await syncStripeDataToAccount(account);
      } catch (error) {
        // The webhook will sync eventually; don't 500 a browser redirect.
        console.error('[STRIPE] Eager sync after checkout failed', error);
      }
    }

    return response.redirect(returnTo);
  }

  /**
   * Return current (cached) subscription state.
   */
  async status(context: HttpContext) {
    return action(context, billingStatus);
  }

  /**
   * Create a Stripe Billing Portal session.
   */
  async portal(context: HttpContext) {
    return action(context, billingPortal);
  }
}
