import type { HttpContext } from '@adonisjs/core/http';
import env from '#start/env';
import { DOMAIN } from '#start/env';
import { jsonapi } from '#jsonapi';
import type { Response } from '#jsonapi';
import Account from '#models/account';
import { stripe } from '#services/stripe';
import {
  getOrCreateStripeCustomerIdForAccount,
  syncStripeDataToAccount,
} from '#services/stripe_sync';
import { action } from '../base.js';

function isAccountAdmin(params: { userId: string; account: Account }) {
  const { userId, account } = params;
  return account.admin_id === userId;
}

/**
 * Guard against open-redirect attacks by only allowing redirects to
 * our own domain or relative paths.
 */
export function isSafeRedirect(url: string): boolean {
  if (url.startsWith('/')) {
    // `//evil.com` (and `/\evil.com` in some browsers) are scheme-relative
    // URLs, not paths — they navigate off-site.
    return !url.startsWith('//') && !url.startsWith('/\\');
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname === DOMAIN || parsed.hostname.endsWith(`.${DOMAIN}`);
  } catch {
    return false;
  }
}

type BillingActor = { user: { id: string }; account: Account } | { error: Response };

async function requireAccount(context: HttpContext): Promise<BillingActor> {
  const { auth } = context;

  await auth.authenticateUsing(['web', 'api']);

  const user = auth.user;
  if (!user) {
    return { error: jsonapi.notAuthenticated({ stack: 'No user' }) };
  }

  const account = await Account.find(user.account_id);
  if (!account) {
    return { error: jsonapi.notFound({ kind: 'Account', id: user.account_id }) };
  }

  return { user, account };
}

async function requireAccountAdmin(context: HttpContext): Promise<BillingActor> {
  const actor = await requireAccount(context);
  if ('error' in actor) return actor;

  if (!isAccountAdmin({ userId: actor.user.id, account: actor.account })) {
    return {
      error: jsonapi.notAuthorized({ stack: 'Only the account admin can manage billing' }),
    };
  }

  return actor;
}

async function createCheckoutSession(context: HttpContext): Promise<Response> {
  const actor = await requireAccountAdmin(context);
  if ('error' in actor) return actor.error;

  const { user, account } = actor;

  if (account.hasActiveSubscription) {
    return {
      errors: [
        {
          status: 409,
          title: 'Subscription already active',
          detail:
            'This account already has an active subscription. Use the billing portal to manage it.',
        },
      ],
    };
  }

  // The success handler redirects to `return_to` after syncing; without it
  // the user would land on the cancel URL after paying.
  const successUrl = new URL(env.get('STRIPE_SUCCESS_URL'));
  if (!successUrl.searchParams.has('return_to')) {
    successUrl.searchParams.set('return_to', env.get('STRIPE_PORTAL_RETURN_URL'));
  }

  const customerId = await getOrCreateStripeCustomerIdForAccount({
    account,
    userId: user.id,
  });

  const session = await stripe.checkout.sessions.create({
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

  return {
    data: {
      type: 'stripe-checkout-session',
      attributes: {
        id: session.id,
        url: session.url,
      },
    },
  };
}

async function billingStatus(context: HttpContext): Promise<Response> {
  const actor = await requireAccount(context);
  if ('error' in actor) return actor.error;

  const { account } = actor;

  return {
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
  };
}

async function createPortalSession(context: HttpContext): Promise<Response> {
  const actor = await requireAccountAdmin(context);
  if ('error' in actor) return actor.error;

  const { user, account } = actor;

  const customerId = await getOrCreateStripeCustomerIdForAccount({
    account,
    userId: user.id,
  });

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: env.get('STRIPE_PORTAL_RETURN_URL'),
  });

  return {
    data: {
      type: 'stripe-portal-session',
      attributes: {
        url: session.url,
      },
    },
  };
}

export default class BillingController {
  /**
   * Create a Stripe Checkout session.
   */
  async checkout(context: HttpContext) {
    return action(context, createCheckoutSession);
  }

  /**
   * Users often return before webhooks arrive. Sync eagerly.
   *
   * This is a browser navigation target (Stripe redirects here), so it
   * always redirects — never renders errors.
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
        // The webhook will sync eventually; don't block the user's redirect.
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
    return action(context, createPortalSession);
  }
}
