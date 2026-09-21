import { test } from '@japa/runner';
import { assert } from 'chai';
import type Stripe from 'stripe';
import { PLANS } from '#services/plans';
import { buildBillingHistory } from '#services/stripe_history';

const HOBBY = PLANS[1];
const PROJECT = PLANS[2];

/**
 * Seconds since the epoch, the unit Stripe uses.
 */
const AUG_1 = 1785542400;
const SEP_1 = 1788220800;
const SEP_15 = 1789430400;
const OCT_1 = 1790812800;

function subscription(overrides: Partial<Stripe.Subscription> & { priceId: string }) {
  const { priceId, ...rest } = overrides;
  const price = { id: priceId, unit_amount: 500, recurring: { interval: 'month' } };
  const item = { price, current_period_start: SEP_1, current_period_end: OCT_1 };

  return {
    id: 'sub_1',
    status: 'active',
    currency: 'usd',
    created: AUG_1,
    start_date: AUG_1,
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    ended_at: null,
    trial_end: null,
    items: { data: [item] },
    ...rest,
  } as unknown as Stripe.Subscription;
}

function invoice(overrides: Partial<Stripe.Invoice> & { priceIds: string[] }) {
  const { priceIds, ...rest } = overrides;
  const lines = priceIds.map((id) => ({ pricing: { price_details: { price: id } } }));

  return {
    id: 'in_1',
    number: 'ABCD-0001',
    status: 'paid',
    created: AUG_1,
    period_start: AUG_1,
    period_end: SEP_1,
    total: 500,
    amount_paid: 500,
    amount_due: 0,
    currency: 'usd',
    hosted_invoice_url: 'https://invoice.stripe.com/in_1',
    invoice_pdf: 'https://invoice.stripe.com/in_1.pdf',
    status_transitions: { paid_at: AUG_1 },
    parent: { subscription_details: { subscription: 'sub_1' } },
    lines: { data: lines },
    ...rest,
  } as unknown as Stripe.Invoice;
}

test.group('buildBillingHistory', () => {
  test('maps a subscription with plan, dates, and money', () => {
    const history = buildBillingHistory({
      subscriptions: [subscription({ priceId: HOBBY.stripePriceId })],
      invoices: [],
    });

    const [sub] = history.subscriptions;

    assert.strictEqual(sub.planKey, 'hobby');
    assert.strictEqual(sub.planName, 'Hobby');
    assert.strictEqual(sub.amountInCents, 500);
    assert.strictEqual(sub.interval, 'month');
    assert.strictEqual(sub.startedAt, '2026-08-01T00:00:00.000Z');
    assert.strictEqual(sub.currentPeriodEnd, '2026-10-01T00:00:00.000Z');
    assert.isNull(sub.canceledAt);
  });

  test('an unknown price keeps the subscription with an unknown plan', () => {
    const history = buildBillingHistory({
      subscriptions: [subscription({ priceId: 'price_gone' })],
      invoices: [],
    });

    assert.isNull(history.subscriptions[0].planKey);
    assert.strictEqual(history.subscriptions[0].planName, 'Unknown plan');
  });

  test('maps an invoice with the plan it billed', () => {
    const history = buildBillingHistory({
      subscriptions: [],
      invoices: [invoice({ priceIds: [HOBBY.stripePriceId] })],
    });

    const [inv] = history.invoices;

    assert.strictEqual(inv.number, 'ABCD-0001');
    assert.strictEqual(inv.status, 'paid');
    assert.strictEqual(inv.planName, 'Hobby');
    assert.strictEqual(inv.subscriptionId, 'sub_1');
    assert.strictEqual(inv.totalInCents, 500);
    assert.strictEqual(inv.paidAt, '2026-08-01T00:00:00.000Z');
    assert.strictEqual(inv.hostedInvoiceUrl, 'https://invoice.stripe.com/in_1');
  });

  test('newest first', () => {
    const history = buildBillingHistory({
      subscriptions: [
        subscription({ id: 'sub_old', created: AUG_1, priceId: HOBBY.stripePriceId }),
        subscription({ id: 'sub_new', created: SEP_1, priceId: HOBBY.stripePriceId }),
      ],
      invoices: [
        invoice({ id: 'in_old', created: AUG_1, priceIds: [HOBBY.stripePriceId] }),
        invoice({ id: 'in_new', created: SEP_1, priceIds: [HOBBY.stripePriceId] }),
      ],
    });

    assert.deepEqual(
      history.subscriptions.map((s) => s.id),
      ['sub_new', 'sub_old']
    );
    assert.deepEqual(
      history.invoices.map((i) => i.id),
      ['in_new', 'in_old']
    );
  });

  test('timeline: subscribed, then a plan change found in the invoices', () => {
    const history = buildBillingHistory({
      subscriptions: [subscription({ priceId: PROJECT.stripePriceId })],
      invoices: [
        invoice({ id: 'in_1', created: AUG_1, priceIds: [HOBBY.stripePriceId] }),
        // an upgrade mid-cycle: proration lines first, then the new plan
        invoice({
          id: 'in_2',
          created: SEP_15,
          priceIds: [HOBBY.stripePriceId, PROJECT.stripePriceId],
        }),
      ],
    });

    assert.deepEqual(
      history.events.map((e) => [e.kind, e.at, e.previousPlanName, e.planName]),
      [
        ['plan-changed', '2026-09-15T00:00:00.000Z', 'Hobby', 'Project'],
        ['subscribed', '2026-08-01T00:00:00.000Z', null, 'Project'],
      ]
    );
  });

  test('timeline: a scheduled cancellation says when access ends', () => {
    const history = buildBillingHistory({
      subscriptions: [
        subscription({
          priceId: HOBBY.stripePriceId,
          cancel_at_period_end: true,
          canceled_at: SEP_15,
        }),
      ],
      invoices: [],
    });

    const scheduled = history.events.find((e) => e.kind === 'cancellation-scheduled');

    assert.ok(scheduled);
    assert.strictEqual(scheduled.at, '2026-09-15T00:00:00.000Z');
    assert.strictEqual(scheduled.endsAt, '2026-10-01T00:00:00.000Z');
    assert.isUndefined(history.events.find((e) => e.kind === 'canceled'));
  });

  test('timeline: a canceled subscription has canceled and ended entries', () => {
    const history = buildBillingHistory({
      subscriptions: [
        subscription({
          priceId: HOBBY.stripePriceId,
          status: 'canceled',
          canceled_at: SEP_15,
          ended_at: OCT_1,
        }),
      ],
      invoices: [],
    });

    assert.deepEqual(
      history.events.map((e) => e.kind),
      ['ended', 'canceled', 'subscribed']
    );
    assert.isUndefined(history.events.find((e) => e.kind === 'cancellation-scheduled'));
  });
});
