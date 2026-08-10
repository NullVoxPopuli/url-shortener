export const PLANS = [
  {
    key: 'side-hobby',
    name: 'Side-Hobby',
    priceInCents: 100,
    monthlyLinkLimit: 15,
    teammates: 0,
    customDomains: 0,
    stripePriceId: 'price_1U2ILAKsGhcICKKY7PsC0LTW',
  },
  {
    key: 'hobby',
    name: 'Hobby',
    priceInCents: 500,
    monthlyLinkLimit: 100,
    teammates: 0,
    customDomains: 2,
    stripePriceId: 'price_1U2ILPKsGhcICKKY6OLKcW35',
  },
  {
    key: 'project',
    name: 'Project',
    priceInCents: 1500,
    monthlyLinkLimit: 1000,
    teammates: 2,
    customDomains: 3,
    stripePriceId: 'price_1U2ILeKsGhcICKKYQFVqMsbn',
  },
] as const;

export type PlanKey = (typeof PLANS)[number]['key'];

export const NO_SUBSCRIPTION_PLAN = {
  key: 'none',
  name: 'No subscription',
  priceInCents: 0,
  monthlyLinkLimit: 5,
  teammates: 0,
  customDomains: 0,
} as const;

/**
 * Grandfathered/internal accounts: unlimited (null) everything.
 */
export const FREE_PLAN = {
  key: 'free',
  name: 'Free',
  priceInCents: 0,
  monthlyLinkLimit: null,
  teammates: null,
  customDomains: null,
} as const;

export function planForPriceId(priceId: string | null) {
  return PLANS.find((plan) => plan.stripePriceId === priceId) ?? null;
}

interface PlanHolder {
  isFree: boolean;
  stripePriceId: string | null;
}

export function planFor(account: PlanHolder) {
  return account.isFree ? FREE_PLAN : (planForPriceId(account.stripePriceId) ?? NO_SUBSCRIPTION_PLAN);
}
