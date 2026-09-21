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
    stripeProductId: isTestingStripe ? 'prod_QIhMrp06GfI1Pu' : 'prod_QpTM9VP83chaev',
    prices: {
      month: {
        id: isTestingStripe ? 'price_1PS5xgKsGhcICKKYhoMnFNcU' : 'price_1PxoQ9KsGhcICKKY9K5hYaut',
        amountInCents: 100,
      },
      year: {
        id: isTestingStripe ? 'price_1PS5yHKsGhcICKKYC4vOaFCf' : 'price_1PxoQ9KsGhcICKKYIbutsL9G',
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
    stripeProductId: isTestingStripe ? 'prod_QIhNOrpP5ckWQh' : 'prod_QpTM9xo9CXXsQt',
    prices: {
      month: {
        id: isTestingStripe ? 'price_1PS5zAKsGhcICKKYMNHy5VPa' : 'price_1PxoQBKsGhcICKKYLCo0R5JO',
        amountInCents: 500,
      },
      year: {
        id: isTestingStripe ? 'price_1PS61FKsGhcICKKY3oeFkER3' : 'price_1PxoQBKsGhcICKKYpAI5y722',
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
    stripeProductId: isTestingStripe ? 'prod_QIhOO01uHqIoZY' : 'prod_QpTMV26RczbZmq',
    prices: {
      month: {
        id: isTestingStripe ? 'price_1PS5zaKsGhcICKKYUFzy9Uxk' : 'price_1PxoQEKsGhcICKKYRQmAkFoO',
        amountInCents: 1500,
      },
      year: {
        id: isTestingStripe ? 'price_1PS61aKsGhcICKKYHCoAomIs' : 'price_1PxoQEKsGhcICKKYCv57yPoZ',
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
    stripeProductId: isTestingStripe ? 'prod_QIhPQZXW4aywu2' : 'prod_QpTNivpKSStcaH',
    prices: {
      month: {
        id: isTestingStripe ? 'price_1PS60rKsGhcICKKYNgDoPVji' : 'price_1PxoQGKsGhcICKKYvqMxyEdy',
        amountInCents: 5000,
      },
      year: {
        id: isTestingStripe ? 'price_1PS62AKsGhcICKKYNMVh8ywd' : 'price_1PxoQGKsGhcICKKY2HCEHoFC',
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
 * Internal accounts: unlimited (null) everything.
 */
export const INTERNAL_PLAN = {
  key: 'internal',
  name: 'Internal',
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
  isInternal: boolean;
  stripePriceId: string | null;
  /**
   * After a downgrade: the plan paid for through `stripeDowngradedUntil`
   * (unix seconds). Plan checks use it until then.
   */
  stripeDowngradedFromPriceId?: string | null;
  stripeDowngradedUntil?: number | null;
}

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

export function isDowngradeGraceActive(account: PlanHolder, now = nowInSeconds()) {
  return Boolean(
    account.stripeDowngradedFromPriceId &&
      account.stripeDowngradedUntil !== null &&
      account.stripeDowngradedUntil !== undefined &&
      account.stripeDowngradedUntil > now
  );
}

/**
 * The price whose plan applies right now: the one paid for through the
 * downgrade date while that lasts, else the subscription's price.
 */
export function effectivePriceId(account: PlanHolder, now = nowInSeconds()) {
  return isDowngradeGraceActive(account, now)
    ? (account.stripeDowngradedFromPriceId ?? null)
    : account.stripePriceId;
}

export function planFor(account: PlanHolder, now = nowInSeconds()) {
  return account.isInternal
    ? INTERNAL_PLAN
    : (planForPriceId(effectivePriceId(account, now)) ?? NO_SUBSCRIPTION_PLAN);
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
export function planRank(priceId: string | null) {
  const plan = planForPriceId(priceId);

  return plan ? PLANS.findIndex((candidate) => candidate.key === plan.key) : -1;
}

export interface PendingDowngrade {
  /** the plan the subscription is on, which applies from `at` */
  plan: Plan | typeof NO_SUBSCRIPTION_PLAN;
  /** unix seconds */
  at: number;
}

/**
 * The downgrade in progress: the account still checks against the
 * higher plan until `at`, then drops to `plan`.
 */
export function pendingDowngradeFor(
  account: PlanHolder,
  now = nowInSeconds()
): PendingDowngrade | null {
  if (account.isInternal || !isDowngradeGraceActive(account, now)) return null;

  return {
    plan: planForPriceId(account.stripePriceId) ?? NO_SUBSCRIPTION_PLAN,
    at: account.stripeDowngradedUntil!,
  };
}
