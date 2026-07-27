import type { HttpContext } from '@adonisjs/core/http';
import env from '#start/env';
import { jsonapi } from '#jsonapi';
import type { Response } from '#jsonapi';
import Account from '#models/account';
import { stripe } from '#services/stripe';
import { getOrCreateStripeCustomerIdForAccount } from '#services/stripe_sync';

function mustBeAccountAdmin(params: { userId: string; account: Account }) {
  const { userId, account } = params;
  return account.admin_id === userId;
}

type Actor = { user: { id: string }; account: Account } | { error: Response };

/**
 * Shared prologue for the billing actions.
 *
 * Auth failures throw E_UNAUTHORIZED_ACCESS, which `action()` converts
 * to a jsonapi 401 — expected failures are returned as jsonapi payloads,
 * per the actions/ convention.
 */
async function accountForRequest(
  context: HttpContext,
  options?: { admin?: boolean }
): Promise<Actor> {
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

  if (options?.admin && !mustBeAccountAdmin({ userId: user.id, account })) {
    return { error: jsonapi.notAuthorized({ stack: 'Only the account admin can manage billing' }) };
  }

  return { user, account };
}

export async function billingCheckout(context: HttpContext): Promise<Response> {
  const actor = await accountForRequest(context, { admin: true });
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

export async function billingStatus(context: HttpContext): Promise<Response> {
  const actor = await accountForRequest(context);
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

export async function billingPortal(context: HttpContext): Promise<Response> {
  const actor = await accountForRequest(context, { admin: true });
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
