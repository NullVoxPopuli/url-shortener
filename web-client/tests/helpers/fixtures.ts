import type {
  ApiKey,
  BillingEvent,
  BillingInvoice,
  BillingStatus,
  BillingSubscription,
  Link,
} from '#app/data/types';

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

export function makeSubscription(overrides?: Partial<BillingSubscription>): BillingSubscription {
  return {
    id: 'sub_1',
    status: 'active',
    planKey: 'hobby',
    planName: 'Hobby',
    priceId: 'price_hobby',
    amountInCents: 500,
    currency: 'usd',
    interval: 'month',
    createdAt: '2026-08-01T12:00:00.000Z',
    startedAt: '2026-08-01T12:00:00.000Z',
    currentPeriodStart: '2026-09-01T12:00:00.000Z',
    currentPeriodEnd: '2026-10-01T12:00:00.000Z',
    cancelAtPeriodEnd: false,
    cancelAt: null,
    canceledAt: null,
    endedAt: null,
    trialEnd: null,
    ...overrides,
  };
}

export function makeInvoice(overrides?: Partial<BillingInvoice>): BillingInvoice {
  return {
    id: 'in_1',
    number: 'ABCD-0001',
    status: 'paid',
    subscriptionId: 'sub_1',
    planName: 'Hobby',
    createdAt: '2026-09-01T12:00:00.000Z',
    paidAt: '2026-09-01T12:00:00.000Z',
    periodStart: '2026-09-01T12:00:00.000Z',
    periodEnd: '2026-10-01T12:00:00.000Z',
    totalInCents: 500,
    amountPaidInCents: 500,
    amountDueInCents: 0,
    currency: 'usd',
    hostedInvoiceUrl: 'https://invoice.stripe.com/in_1',
    invoicePdf: 'https://invoice.stripe.com/in_1.pdf',
    ...overrides,
  };
}

export function makeBillingEvent(overrides?: Partial<BillingEvent>): BillingEvent {
  return {
    at: '2026-08-01T12:00:00.000Z',
    kind: 'subscribed',
    subscriptionId: 'sub_1',
    planName: 'Hobby',
    previousPlanName: null,
    endsAt: null,
    ...overrides,
  };
}
