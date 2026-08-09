import type { BillingStatus, Link } from '#app/data/types';

export function makeBilling(overrides?: {
  planKey?: string;
  planName?: string;
  monthlyLinkLimit?: number | null;
  used?: number;
  remaining?: number | null;
  hasActiveSubscription?: boolean;
  cancelAtPeriodEnd?: boolean;
}): BillingStatus {
  const {
    planKey = 'none',
    planName = 'No subscription',
    monthlyLinkLimit = 5,
    used = 0,
    remaining = 5,
    hasActiveSubscription = false,
    cancelAtPeriodEnd = false,
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
      currentPeriodStart: hasActiveSubscription ? '2026-08-01T00:00:00Z' : null,
      currentPeriodEnd: hasActiveSubscription ? '2026-09-01T00:00:00Z' : null,
      cancelAtPeriodEnd,
    },
    plan: {
      key: planKey,
      name: planName,
      priceInCents: 0,
      monthlyLinkLimit,
    },
    usage: {
      used,
      remaining,
      periodStart: '2026-08-01T00:00:00.000Z',
      periodEnd: '2026-08-31T23:59:59.999Z',
    },
    availablePlans: [],
    paymentMethod: { brand: null, last4: null },
    lastSyncedAt: null,
  } as unknown as BillingStatus;
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
