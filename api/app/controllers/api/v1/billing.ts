import type { HttpContext } from '@adonisjs/core/http';
import env from '#start/env';
import { DOMAIN } from '#start/env';
import { jsonapi } from '#jsonapi';
import Account from '#models/account';
import { stripe } from '#services/stripe';
import {
  getOrCreateStripeCustomerIdForAccount,
  syncStripeDataToAccount,
} from '#services/stripe_sync';

function mustBeAccountAdmin(params: { userId: string; account: Account }) {
  const { userId, account } = params;
  return account.admin_id === userId;
}

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
    const { auth } = context;

    try {
      await auth.authenticateUsing(['web', 'api']);
    } catch (error) {
      return jsonapi.send(context, jsonapi.notAuthenticated(error));
    }

    const user = auth.user;
    if (!user) {
      return jsonapi.send(context, jsonapi.notAuthenticated({ stack: 'No user' }));
    }

    const account = await Account.find(user.account_id);
    if (!account) {
      return jsonapi.send(context, jsonapi.notFound({ kind: 'Account', id: user.account_id }));
    }

    if (!mustBeAccountAdmin({ userId: user.id, account })) {
      return jsonapi.send(
        context,
        jsonapi.notAuthorized({ stack: 'Only the account admin can manage billing' })
      );
    }

    if (account.hasActiveSubscription) {
      return jsonapi.send(context, {
        errors: [
          {
            status: 409,
            title: 'Subscription already active',
            detail:
              'This account already has an active subscription. Use the billing portal to manage it.',
          },
        ],
      });
    }

    // The success handler redirects to `return_to` after syncing; without it
    // the user would land on the cancel URL after paying.
    const successUrl = new URL(env.get('STRIPE_SUCCESS_URL'));
    if (!successUrl.searchParams.has('return_to')) {
      successUrl.searchParams.set('return_to', env.get('STRIPE_PORTAL_RETURN_URL'));
    }

    let session;
    try {
      const customerId = await getOrCreateStripeCustomerIdForAccount({
        account,
        userId: user.id,
      });

      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: env.get('STRIPE_PRICE_ID'), quantity: 1 }],
        success_url: successUrl.toString(),
        cancel_url: env.get('STRIPE_CANCEL_URL'),
        // Helps you correlate sessions to your own data when debugging.
        client_reference_id: account.id,
        metadata: {
          accountId: account.id,
        },
      });
    } catch (error) {
      // Stripe being down should be a { json:api } 500, not an HTML error page.
      return jsonapi.send(context, jsonapi.serverError(error));
    }

    return jsonapi.send(context, {
      data: {
        type: 'stripe-checkout-session',
        attributes: {
          id: session.id,
          url: session.url,
        },
      },
    });
  }

  /**
   * Users often return before webhooks arrive. Sync eagerly.
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
    const { auth } = context;

    try {
      await auth.authenticateUsing(['web', 'api']);
    } catch (error) {
      return jsonapi.send(context, jsonapi.notAuthenticated(error));
    }

    const user = auth.user;
    if (!user) {
      return jsonapi.send(context, jsonapi.notAuthenticated({ stack: 'No user' }));
    }

    const account = await Account.find(user.account_id);
    if (!account) {
      return jsonapi.send(context, jsonapi.notFound({ kind: 'Account', id: user.account_id }));
    }

    return jsonapi.send(context, {
      data: {
        type: 'billing-status',
        id: account.id,
        attributes: {
          isFree: account.isFree,
          hasActiveSubscription: account.hasActiveSubscription,
          stripe: {
            customerId: account.stripeCustomerId,
            subscriptionId: account.stripeSubscriptionId,
            subscriptionStatus: account.stripeSubscriptionStatus,
            priceId: account.stripePriceId,
            currentPeriodStart: account.stripeCurrentPeriodStart,
            currentPeriodEnd: account.stripeCurrentPeriodEnd,
            cancelAtPeriodEnd: account.stripeCancelAtPeriodEnd,
            paymentMethod: {
              brand: account.stripePaymentMethodBrand,
              last4: account.stripePaymentMethodLast4,
            },
            lastSyncedAt: account.stripeLastSyncedAt?.toISO() ?? null,
          },
        },
      },
    });
  }

  /**
   * Create a Stripe Billing Portal session.
   */
  async portal(context: HttpContext) {
    const { auth } = context;

    try {
      await auth.authenticateUsing(['web', 'api']);
    } catch (error) {
      return jsonapi.send(context, jsonapi.notAuthenticated(error));
    }

    const user = auth.user;
    if (!user) {
      return jsonapi.send(context, jsonapi.notAuthenticated({ stack: 'No user' }));
    }

    const account = await Account.find(user.account_id);
    if (!account) {
      return jsonapi.send(context, jsonapi.notFound({ kind: 'Account', id: user.account_id }));
    }

    if (!mustBeAccountAdmin({ userId: user.id, account })) {
      return jsonapi.send(
        context,
        jsonapi.notAuthorized({ stack: 'Only the account admin can manage billing' })
      );
    }

    let session;
    try {
      const customerId = await getOrCreateStripeCustomerIdForAccount({
        account,
        userId: user.id,
      });

      session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: env.get('STRIPE_PORTAL_RETURN_URL'),
      });
    } catch (error) {
      return jsonapi.send(context, jsonapi.serverError(error));
    }

    return jsonapi.send(context, {
      data: {
        type: 'stripe-portal-session',
        attributes: {
          url: session.url,
        },
      },
    });
  }
}
