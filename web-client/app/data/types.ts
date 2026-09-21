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

export interface BillingSubscription {
  id: string;
  status: string;
  planKey: string | null;
  planName: string;
  priceId: string | null;
  amountInCents: number | null;
  currency: string;
  interval: string | null;
  createdAt: string;
  startedAt: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  canceledAt: string | null;
  endedAt: string | null;
  trialEnd: string | null;
}

export interface BillingInvoice {
  id: string;
  number: string | null;
  status: string | null;
  subscriptionId: string | null;
  planName: string | null;
  createdAt: string;
  paidAt: string | null;
  periodStart: string;
  periodEnd: string;
  totalInCents: number;
  amountPaidInCents: number;
  amountDueInCents: number;
  currency: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

export type BillingEventKind =
  | 'subscribed'
  | 'plan-changed'
  | 'cancellation-scheduled'
  | 'canceled'
  | 'ended';

export interface BillingEvent {
  at: string;
  kind: BillingEventKind;
  subscriptionId: string;
  planName: string | null;
  previousPlanName: string | null;
  endsAt: string | null;
}

export interface BillingHistory {
  id: string;
  subscriptions: BillingSubscription[];
  invoices: BillingInvoice[];
  events: BillingEvent[];
  [Type]: 'billing-history';
}

export interface Link {
  id: string;
  shortUrl: string;
  domain: string | null;
  original: string;
  visits: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  [Type]: 'link';
}

export interface ApiUser {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string | null;
  [Type]: 'user';
}

export interface ApiAccount {
  id: string;
  name: string;
  isFree: boolean | null;
  createdAt: string;
  updatedAt: string | null;
  admin: ApiUser;
  [Type]: 'account';
}

export interface Membership {
  id: string;
  role: 'admin' | 'member';
  createdAt: string;
  user: ApiUser;
  account: ApiAccount;
  [Type]: 'membership';
}

export interface Invitation {
  id: string;
  role: 'admin' | 'member';
  token: string;
  acceptUrl: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  account: ApiAccount;
  [Type]: 'invitation';
}

export interface CustomDomain {
  id: string;
  hostname: string;
  createdAt: string;
  account: ApiAccount;
  [Type]: 'custom-domain';
}

export interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  /**
   * The secret — only present in the create response; it cannot be
   * retrieved again.
   */
  token?: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  [Type]: 'api-key';
}

export interface ApiKeyQuota {
  limit: number | null;
  used: number;
  remaining: number | null;
}
