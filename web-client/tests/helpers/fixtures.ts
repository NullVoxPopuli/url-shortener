import type { ApiKey, BillingStatus, Link, PlanResource } from '#app/data/types';

export function makeBilling(overrides?: {
  planKey?: string;
  planName?: string;
  monthlyLinkLimit?: number | null;
  used?: number;
  remaining?: number | null;
  hasActiveSubscription?: boolean;
  cancelAtPeriodEnd?: boolean;
  linkEditsPerMonth?: number | null;
  linkExpiration?: boolean;
  editsUsed?: number;
  editsRemaining?: number | null;
  pendingDowngrade?: BillingStatus['pendingDowngrade'];
}): BillingStatus {
  const {
    planKey = 'none',
    planName = 'No subscription',
    monthlyLinkLimit = 5,
    used = 0,
    remaining = 5,
    hasActiveSubscription = false,
    cancelAtPeriodEnd = false,
    linkEditsPerMonth = 0,
    linkExpiration = false,
    editsUsed = 0,
    editsRemaining = linkEditsPerMonth === null ? null : linkEditsPerMonth - editsUsed,
    pendingDowngrade = null,
  } = overrides ?? {};

  return {
    id: 'account-1',
    isFree: planKey === 'free',
    hasActiveSubscription,
    stripe: {
      customerId: null,
      subscriptionId: null,
      subscriptionStatus: hasActiveSubscription ? 'active' : null,
      priceId: null,
      interval: null,
      // unix seconds, like the api sends
      currentPeriodStart: hasActiveSubscription ? 1785585600 : null,
      currentPeriodEnd: hasActiveSubscription ? 1788264000 : null,
      cancelAtPeriodEnd,
      pendingPriceId: pendingDowngrade?.plan.key ?? null,
      pendingAt: pendingDowngrade?.at ?? null,
    },
    pendingDowngrade,
    plan: {
      key: planKey,
      name: planName,
      monthlyLinkLimit,
      linkEditsPerMonth,
      linkExpiration,
    },
    usage: {
      used,
      remaining,
      periodStart: '2026-08-01T00:00:00.000Z',
      periodEnd: '2026-08-31T23:59:59.999Z',
      editsUsed,
      editsRemaining,
    },
    paymentMethod: { brand: null, last4: null },
    lastSyncedAt: null,
  } as unknown as BillingStatus;
}

export function makeApiKey(overrides?: Partial<Record<keyof ApiKey, unknown>>): ApiKey {
  return {
    id: 'key-1',
    name: 'CI deploys',
    scopes: ['links:read'],
    createdAt: '2026-08-09T12:00:00.000Z',
    lastUsedAt: null,
    expiresAt: null,
    ...overrides,
  } as unknown as ApiKey;
}

export function makeLink(overrides?: Partial<Record<keyof Link, unknown>>): Link {
  return {
    id: 'link-1',
    shortUrl: 'https://nvp.local/abc123',
    original: 'https://example.com/a/very/long/path',
    visits: 0,
    createdAt: '2026-08-09T12:00:00.000Z',
    updatedAt: '2026-08-09T12:00:00.000Z',
    expiresAt: null,
    ...overrides,
  } as unknown as Link;
}


export function makePlan(overrides?: Partial<PlanResource>): PlanResource {
  return {
    id: 'pro',
    key: 'pro',
    name: 'Pro',
    stripeProductId: 'prod_pro',
    prices: {
      month: { id: 'price_pro_month', amountInCents: 1500 },
      year: { id: 'price_pro_year', amountInCents: 16500 },
    },
    monthlyLinkLimit: 1000,
    linkEditsPerMonth: 50,
    linkExpiration: true,
    ...overrides,
  } as unknown as PlanResource;
}
