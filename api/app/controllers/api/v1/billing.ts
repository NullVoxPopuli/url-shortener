import type { HttpContext } from '@adonisjs/core/http';
import env from '#start/env';
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

export default class BillingController {
  /**
   * Create a Stripe Checkout session.
   */
  async checkout(context: HttpContext) {
    const { auth } = context;

    await auth.authenticateUsing(['web', 'api']);

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

    const customerId = await getOrCreateStripeCustomerIdForAccount({
      account,
      userId: user.id,
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: env.get('STRIPE_PRICE_ID'), quantity: 1 }],
      success_url: env.get('STRIPE_SUCCESS_URL'),
      cancel_url: env.get('STRIPE_CANCEL_URL'),
      // Helps you correlate sessions to your own data when debugging.
      client_reference_id: account.id,
      metadata: {
        accountId: account.id,
      },
    });

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
    const returnTo = request.input('return_to') || env.get('STRIPE_CANCEL_URL');

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
      await syncStripeDataToAccount(account);
    }

    return response.redirect(returnTo);
  }

  /**
   * Return current (cached) subscription state.
   */
  async status(context: HttpContext) {
    const { auth } = context;

    await auth.authenticateUsing(['web', 'api']);

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

    await auth.authenticateUsing(['web', 'api']);

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

    const customerId = await getOrCreateStripeCustomerIdForAccount({
      account,
      userId: user.id,
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: env.get('STRIPE_PORTAL_RETURN_URL'),
    });

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
