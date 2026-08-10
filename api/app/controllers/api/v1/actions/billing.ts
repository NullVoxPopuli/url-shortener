import type { HttpContext } from '@adonisjs/core/http';
import env from '#start/env';
import { notAuthorized, notFound } from '#exceptions/api_errors';
import { JsonApiException } from '@evoactivity/jsonapi-adonis';
import type Account from '#models/account';
import { accountContext } from '#services/account_context';
import { stripe } from '#services/stripe';
import { getOrCreateStripeCustomerIdForAccount } from '#services/stripe_sync';
import { quotaForAccount } from '#services/link_quota';
import { PLANS } from '#services/plans';

function mustBeAccountAdmin(params: { userId: string; account: Account }) {
  const { userId, account } = params;
  return account.admin_id === userId;
}

/**
 * Shared prologue for the billing actions. Failures throw and render
 * as JSON:API error documents in the action wrapper.
 */
async function accountForRequest(context: HttpContext, options?: { admin?: boolean }) {
  const { auth } = context;

  /**
   * Billing is session-only: API keys are scoped to links and cannot
   * see or change billing.
   */
  const user = await auth.use('web').authenticate();

  const account = await accountContext(context, user);
  if (!account) {
    throw notFound('Account', String(context.request.input('accountId')));
  }

  if (options?.admin && !mustBeAccountAdmin({ userId: user.id, account })) {
    throw notAuthorized('Only the account admin can manage billing');
  }

  return { user, account };
}

export async function billingCheckout(context: HttpContext) {
  const { user, account } = await accountForRequest(context, { admin: true });
  const requestedPlan = context.request.input('plan');
  const plan = PLANS.find((candidate) => candidate.key === requestedPlan) ?? PLANS[0];
  const priceId = plan.stripePriceId;

  if (account.hasActiveSubscription) {
    throw new JsonApiException(
      {
        title: 'Subscription already active',
        detail:
          'This account already has an active subscription. Use the billing portal to manage it.',
      },
      { status: 409 }
    );
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
    line_items: [{ price: priceId, quantity: 1 }],
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

export async function billingStatus(context: HttpContext) {
  const { account } = await accountForRequest(context);
  const quota = await quotaForAccount(account);

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
        },
        plan: quota.plan,
        usage: {
          used: quota.used,
          remaining: quota.remaining,
          periodStart: quota.periodStart,
          periodEnd: quota.periodEnd,
        },
        availablePlans: PLANS.map((plan) => ({ ...plan })),
        paymentMethod: {
          brand: account.stripePaymentMethodBrand,
          last4: account.stripePaymentMethodLast4,
        },
        lastSyncedAt: account.stripeLastSyncedAt?.toISO() ?? null,
      },
    },
  };
}

export async function billingPortal(context: HttpContext) {
  const { user, account } = await accountForRequest(context, { admin: true });

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
