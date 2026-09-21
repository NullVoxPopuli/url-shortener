import { isTestingStripe } from '#start/env';

/**
 * Each paid plan is one Stripe product with one recurring price per
 * billing interval. `node ace stripe:prices` prints the products and
 * prices of the configured Stripe account in this shape.
 */
export type BillingInterval = 'month' | 'year';

export interface PlanPrice {
  id: string;
  amountInCents: number;
}

export type PlanPrices = Record<BillingInterval, PlanPrice>;

export const BILLING_INTERVALS: BillingInterval[] = ['month', 'year'];

/**
 * TODO: replace the `price_..._TODO` ids with the ids from Stripe.
 * `node ace stripe:prices` lists them. Only Vast's are filled in.
 */
export const PLANS = [
  {
    key: 'base',
    name: 'Base',
    stripeProductId: 'prod_base_TODO',
    prices: {
      month: {
        id: isTestingStripe ? 'price_1PS5xgKsGhcICKKYhoMnFNcU' : 'TODO',
        amountInCents: 100,
      },
      year: {
        id: isTestingStripe ? 'price_1PS5yHKsGhcICKKYC4vOaFCf' : 'TODO',
        amountInCents: 1100,
      },
    },
    monthlyLinkLimit: 15,
    teammates: 0,
    customDomains: 0,
    additionalAccounts: 1,
    apiKeys: 0,
    linkEditsPerMonth: 0,
    linkExpiration: false,
  },
  {
    key: 'essentials',
    name: 'Essentials',
    stripeProductId: 'prod_essentials_TODO',
    prices: {
      month: {
        id: isTestingStripe ? 'price_1PS5zAKsGhcICKKYMNHy5VPa' : 'TODO',
        amountInCents: 500,
      },
      year: {
        id: isTestingStripe ? 'price_1PS61FKsGhcICKKY3oeFkER3' : 'TODO',
        amountInCents: 5500,
      },
    },
    monthlyLinkLimit: 100,
    teammates: 0,
    customDomains: 2,
    additionalAccounts: 2,
    apiKeys: 1,
    linkEditsPerMonth: 0,
    linkExpiration: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    stripeProductId: 'prod_pro_TODO',
    prices: {
      month: {
        id: isTestingStripe ? 'price_1PS5zaKsGhcICKKYUFzy9Uxk' : 'TODO',
        amountInCents: 1500,
      },
      year: {
        id: isTestingStripe ? 'price_1PS61aKsGhcICKKYHCoAomIs' : 'TODO',
        amountInCents: 16500,
      },
    },
    monthlyLinkLimit: 1000,
    teammates: 2,
    customDomains: 3,
    additionalAccounts: 3,
    apiKeys: 3,
    linkEditsPerMonth: 50,
    linkExpiration: true,
  },
  {
    key: 'vast',
    name: 'Vast',
    stripeProductId: 'prod_QIhPQZXW4aywu2',
    prices: {
      month: {
        id: isTestingStripe ? 'price_1PS60rKsGhcICKKYNgDoPVji' : 'TODO',
        amountInCents: 5000,
      },
      year: {
        id: isTestingStripe ? 'price_1PS62AKsGhcICKKYNMVh8ywd' : 'TODO',
        amountInCents: 55000,
      },
    },
    monthlyLinkLimit: 10000,
    teammates: 10,
    customDomains: 10,
    additionalAccounts: 10,
    apiKeys: 10,
    linkEditsPerMonth: 500,
    linkExpiration: true,
  },
] as const;

export type Plan = (typeof PLANS)[number];
export type PlanKey = Plan['key'];

export const NO_SUBSCRIPTION_PLAN = {
  key: 'none',
  name: 'No subscription',
  monthlyLinkLimit: 5,
  teammates: 0,
  customDomains: 0,
  additionalAccounts: 0,
  apiKeys: 0,
  linkEditsPerMonth: 0,
  linkExpiration: false,
} as const;

/**
 * Grandfathered/internal accounts: unlimited (null) everything.
 */
export const FREE_PLAN = {
  key: 'free',
  name: 'Free',
  monthlyLinkLimit: null,
  teammates: null,
  customDomains: null,
  additionalAccounts: null,
  apiKeys: null,
  linkEditsPerMonth: null,
  linkExpiration: true,
} as const;

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === 'month' || value === 'year';
}

export function planForKey(key: string | null | undefined) {
  return PLANS.find((plan) => plan.key === key) ?? null;
}

/**
 * Any of a plan's prices identifies the plan.
 */
export function planForPriceId(priceId: string | null) {
  if (!priceId) return null;

  return PLANS.find((plan) => intervalForPriceId(plan, priceId) !== null) ?? null;
}

export function intervalForPriceId(plan: Plan, priceId: string | null): BillingInterval | null {
  if (!priceId) return null;

  return BILLING_INTERVALS.find((interval) => plan.prices[interval].id === priceId) ?? null;
}

interface PlanHolder {
  isFree: boolean;
  stripePriceId: string | null;
}

export function planFor(account: PlanHolder) {
  return account.isFree
    ? FREE_PLAN
    : (planForPriceId(account.stripePriceId) ?? NO_SUBSCRIPTION_PLAN);
}

/**
 * The billing interval of the account's current price, when it is on
 * a paid plan.
 */
export function billingIntervalFor(account: PlanHolder): BillingInterval | null {
  const plan = planForPriceId(account.stripePriceId);

  return plan ? intervalForPriceId(plan, account.stripePriceId) : null;
}

/**
 * Position in PLANS, cheapest first. Unpaid plans rank below every paid one.
 */
export function planRank(plan: { key: string }) {
  return PLANS.findIndex((candidate) => candidate.key === plan.key);
}

export interface PendingPlanChange {
  kind: 'downgrade' | 'upgrade';
  plan: Plan;
  /** unix seconds, when Stripe switches the subscription */
  at: number | null;
}

interface PendingChangeHolder extends PlanHolder {
  stripePendingPriceId: string | null;
  stripePendingAt: number | null;
}

/**
 * The plan change Stripe has scheduled, if any. The account keeps its
 * current plan until `at`.
 */
export function pendingPlanChangeFor(account: PendingChangeHolder): PendingPlanChange | null {
  const pending = planForPriceId(account.stripePendingPriceId);

  if (!pending) return null;

  const current = planFor(account);

  if (pending.key === current.key) return null;

  return {
    kind: planRank(pending) < planRank(current) ? 'downgrade' : 'upgrade',
    plan: pending,
    at: account.stripePendingAt,
  };
}
