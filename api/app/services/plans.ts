export const PLANS = [
  {
    key: 'side-hobby',
    name: 'Side-Hobby',
    priceInCents: 100,
    monthlyLinkLimit: 15,
    stripePriceId: 'price_1U2ILAKsGhcICKKY7PsC0LTW',
  },
  {
    key: 'hobby',
    name: 'Hobby',
    priceInCents: 500,
    monthlyLinkLimit: 100,
    stripePriceId: 'price_1U2ILPKsGhcICKKY6OLKcW35',
  },
  {
    key: 'project',
    name: 'Project',
    priceInCents: 1500,
    monthlyLinkLimit: 1000,
    stripePriceId: 'price_1U2ILeKsGhcICKKYQFVqMsbn',
  },
] as const;

export type PlanKey = (typeof PLANS)[number]['key'];

export const NO_SUBSCRIPTION_PLAN = {
  key: 'none',
  name: 'No subscription',
  priceInCents: 0,
  monthlyLinkLimit: 5,
} as const;

export const FREE_PLAN = {
  key: 'free',
  name: 'Free',
  priceInCents: 0,
  monthlyLinkLimit: null,
} as const;

export function planForPriceId(priceId: string | null) {
  return PLANS.find((plan) => plan.stripePriceId === priceId) ?? null;
}
