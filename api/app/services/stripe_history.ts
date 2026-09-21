import type Stripe from 'stripe';
import { planForPriceId } from '#services/plans';

/**
 * Stripe keeps the customer's subscriptions and invoices. This module turns
 * those into the shape the billing settings screen renders, with dates as
 * ISO strings and money in cents.
 */

export interface BillingSubscription {
  id: string;
  status: Stripe.Subscription.Status;
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
  status: Stripe.Invoice.Status | null;
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
  /**
   * For a scheduled cancellation: when access stops.
   */
  endsAt: string | null;
}

export interface BillingHistory {
  subscriptions: BillingSubscription[];
  invoices: BillingInvoice[];
  events: BillingEvent[];
}

export const EMPTY_BILLING_HISTORY: BillingHistory = {
  subscriptions: [],
  invoices: [],
  events: [],
};

function iso(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;

  return new Date(seconds * 1000).toISOString();
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;

  return typeof value === 'string' ? value : value.id;
}

function planNameFor(priceId: string | null) {
  return planForPriceId(priceId)?.name ?? null;
}

function lineItemPriceId(line: Stripe.InvoiceLineItem): string | null {
  return idOf(line.pricing?.price_details?.price);
}

/**
 * Stripe lists proration lines before the line for the plan that applies
 * from now on, so the last line names the plan the invoice bills for.
 */
function invoicePriceId(invoice: Stripe.Invoice): string | null {
  const lines = invoice.lines?.data ?? [];
  const last = lines[lines.length - 1];

  return last ? lineItemPriceId(last) : null;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  return idOf(invoice.parent?.subscription_details?.subscription);
}

export function toBillingSubscription(subscription: Stripe.Subscription): BillingSubscription {
  const item = subscription.items.data[0];
  const price = item?.price;
  const priceId = price?.id ?? null;
  const plan = planForPriceId(priceId);

  return {
    id: subscription.id,
    status: subscription.status,
    planKey: plan?.key ?? null,
    planName: plan?.name ?? price?.nickname ?? 'Unknown plan',
    priceId,
    amountInCents: price?.unit_amount ?? null,
    currency: subscription.currency,
    interval: price?.recurring?.interval ?? null,
    createdAt: iso(subscription.created)!,
    startedAt: iso(subscription.start_date)!,
    currentPeriodStart: iso(item?.current_period_start),
    currentPeriodEnd: iso(item?.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: iso(subscription.cancel_at),
    canceledAt: iso(subscription.canceled_at),
    endedAt: iso(subscription.ended_at),
    trialEnd: iso(subscription.trial_end),
  };
}

export function toBillingInvoice(invoice: Stripe.Invoice): BillingInvoice {
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    subscriptionId: invoiceSubscriptionId(invoice),
    planName: planNameFor(invoicePriceId(invoice)),
    createdAt: iso(invoice.created)!,
    paidAt: iso(invoice.status_transitions?.paid_at),
    periodStart: iso(invoice.period_start)!,
    periodEnd: iso(invoice.period_end)!,
    totalInCents: invoice.total,
    amountPaidInCents: invoice.amount_paid,
    amountDueInCents: invoice.amount_due,
    currency: invoice.currency,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
  };
}

/**
 * Stripe has no plan-change log, so plan changes come from the invoices:
 * each invoice bills one plan, and a different plan than the previous
 * invoice of the same subscription means the customer switched.
 */
function planChangeEvents(subscription: Stripe.Subscription, invoices: Stripe.Invoice[]) {
  const events: BillingEvent[] = [];
  const own = invoices
    .filter((invoice) => invoiceSubscriptionId(invoice) === subscription.id)
    .sort((a, b) => a.created - b.created);

  let previousPriceId: string | null = null;

  for (const invoice of own) {
    const priceId = invoicePriceId(invoice);

    if (!priceId) continue;

    if (previousPriceId && priceId !== previousPriceId) {
      events.push({
        at: iso(invoice.created)!,
        kind: 'plan-changed',
        subscriptionId: subscription.id,
        planName: planNameFor(priceId),
        previousPlanName: planNameFor(previousPriceId),
        endsAt: null,
      });
    }

    previousPriceId = priceId;
  }

  return events;
}

function lifecycleEvents(subscription: Stripe.Subscription): BillingEvent[] {
  const summary = toBillingSubscription(subscription);
  const base = { subscriptionId: subscription.id, previousPlanName: null, endsAt: null };
  const events: BillingEvent[] = [
    { ...base, at: summary.startedAt, kind: 'subscribed', planName: summary.planName },
  ];

  const isCanceled = subscription.status === 'canceled';
  const isScheduled = !isCanceled && (subscription.cancel_at_period_end || subscription.cancel_at);

  if (isScheduled) {
    events.push({
      ...base,
      at: summary.canceledAt ?? summary.createdAt,
      kind: 'cancellation-scheduled',
      planName: summary.planName,
      endsAt: summary.cancelAt ?? summary.currentPeriodEnd,
    });
  }

  if (isCanceled) {
    events.push({
      ...base,
      at: summary.canceledAt ?? summary.endedAt ?? summary.createdAt,
      kind: 'canceled',
      planName: summary.planName,
    });
  }

  if (summary.endedAt) {
    events.push({ ...base, at: summary.endedAt, kind: 'ended', planName: summary.planName });
  }

  return events;
}

export function buildBillingHistory(params: {
  subscriptions: Stripe.Subscription[];
  invoices: Stripe.Invoice[];
}): BillingHistory {
  const { subscriptions, invoices } = params;

  const events = subscriptions
    .flatMap((subscription) => [
      ...lifecycleEvents(subscription),
      ...planChangeEvents(subscription, invoices),
    ])
    .sort((a, b) => b.at.localeCompare(a.at));

  return {
    subscriptions: subscriptions
      .map(toBillingSubscription)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    invoices: invoices.map(toBillingInvoice).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    events,
  };
}
