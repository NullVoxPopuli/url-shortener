import type { Type } from '@warp-drive/core/types/symbols';

export interface Plan {
  key: string;
  name: string;
  priceInCents: number;
  monthlyLinkLimit: number | null;
  stripePriceId?: string;
}

export interface BillingStatus {
  id: string;
  isFree: boolean;
  hasActiveSubscription: boolean;
  stripe: {
    customerId: string | null;
    subscriptionId: string | null;
    subscriptionStatus: string | null;
    priceId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  plan: Plan;
  usage: {
    used: number;
    remaining: number | null;
    periodStart: string | null;
    periodEnd: string | null;
  };
  availablePlans: Plan[];
  paymentMethod: {
    brand: string | null;
    last4: string | null;
  };
  lastSyncedAt: string | null;
  [Type]: 'billing-status';
}

export interface Link {
  id: string;
  shortUrl: string;
  original: string;
  visits: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  [Type]: 'link';
}
