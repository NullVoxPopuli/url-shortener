import { render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { BillingTimeline } from '#app/routes/dashboard/settings/billing/billing-timeline.gts';
import { InvoiceTable } from '#app/routes/dashboard/settings/billing/invoice-table.gts';
import { SubscriptionDetails } from '#app/routes/dashboard/settings/billing/subscription-details.gts';
import {
  makeBilling,
  makeBillingEvent,
  makeInvoice,
  makeSubscription,
} from '#test-helpers/fixtures';

module('Rendering | settings/billing | SubscriptionDetails', function (hooks) {
  setupRenderingTest(hooks);

  test('live subscription: plan, status, price, dates, manage button', async function (assert) {
    const billing = makeBilling({ planKey: 'hobby', planName: 'Hobby', hasActiveSubscription: true });
    const subscription = makeSubscription();

    await render(
      <template>
        <SubscriptionDetails @billing={{billing}} @subscription={{subscription}} />
      </template>
    );

    assert.dom('.plan-name').hasText('Hobby');
    assert.dom('section').containsText('Active');
    assert.dom('section').containsText('$5.00 / month');
    assert.dom('section').containsText('Aug 1, 2026');
    assert.dom('section').containsText('Oct 1, 2026');
    assert.dom('section').doesNotContainText('Cancellation');
    assert.dom('button').containsText('Manage billing');
  });

  test('scheduled cancellation: shows the request date and the end date', async function (assert) {
    const billing = makeBilling({ planKey: 'hobby', planName: 'Hobby', hasActiveSubscription: true });
    const subscription = makeSubscription({
      cancelAtPeriodEnd: true,
      canceledAt: '2026-09-15T12:00:00.000Z',
    });

    await render(
      <template>
        <SubscriptionDetails @billing={{billing}} @subscription={{subscription}} />
      </template>
    );

    assert.dom('section').containsText('Cancellation');
    assert.dom('section').containsText('Requested Sep 15, 2026');
    assert.dom('section').containsText('Your plan ends Oct 1, 2026');
  });

  test('cached status only: still shows plan and period', async function (assert) {
    const billing = makeBilling({ planKey: 'hobby', planName: 'Hobby', hasActiveSubscription: true });

    await render(
      <template>
        <SubscriptionDetails @billing={{billing}} @subscription={{null}} />
      </template>
    );

    assert.dom('.plan-name').hasText('Hobby');
    assert.dom('section').containsText('Current period');
    assert.dom('button').containsText('Manage billing');
  });

  test('no subscription: pricing link, no button', async function (assert) {
    const billing = makeBilling();

    await render(
      <template>
        <SubscriptionDetails @billing={{billing}} @subscription={{null}} />
      </template>
    );

    assert.dom('section').containsText('no paid subscription');
    assert.dom('a[href="/pricing"]').exists();
    assert.dom('button').doesNotExist();
  });
});

module('Rendering | settings/billing | BillingTimeline', function (hooks) {
  setupRenderingTest(hooks);

  test('describes each kind of event', async function (assert) {
    const events = [
      makeBillingEvent({
        at: '2026-09-15T12:00:00.000Z',
        kind: 'cancellation-scheduled',
        endsAt: '2026-10-01T12:00:00.000Z',
      }),
      makeBillingEvent({
        at: '2026-09-01T12:00:00.000Z',
        kind: 'plan-changed',
        previousPlanName: 'Side-Hobby',
        planName: 'Hobby',
      }),
      makeBillingEvent({ at: '2026-08-01T12:00:00.000Z', kind: 'subscribed', planName: 'Side-Hobby' }),
    ];

    await render(<template><BillingTimeline @events={{events}} /></template>);

    assert.dom('li').exists({ count: 3 });
    assert.dom('li:nth-child(1)').containsText('Sep 15, 2026');
    assert.dom('li:nth-child(1)').containsText('Cancellation requested. Hobby ends Oct 1, 2026');
    assert.dom('li:nth-child(2)').containsText('Changed plan from Side-Hobby to Hobby');
    assert.dom('li:nth-child(3)').containsText('Subscribed to Side-Hobby');
  });

  test('empty', async function (assert) {
    const events: never[] = [];

    await render(<template><BillingTimeline @events={{events}} /></template>);

    assert.dom('li').doesNotExist();
    assert.dom().containsText('No subscription activity yet');
  });
});

module('Rendering | settings/billing | InvoiceTable', function (hooks) {
  setupRenderingTest(hooks);

  test('one row per invoice with money, status, and links', async function (assert) {
    const invoices = [
      makeInvoice(),
      makeInvoice({
        id: 'in_2',
        number: 'ABCD-0002',
        status: 'open',
        totalInCents: 1500,
        planName: 'Project',
        hostedInvoiceUrl: null,
        invoicePdf: null,
      }),
    ];

    await render(<template><InvoiceTable @invoices={{invoices}} /></template>);

    assert.dom('tbody tr').exists({ count: 2 });
    assert.dom('tbody tr:nth-child(1)').containsText('ABCD-0001');
    assert.dom('tbody tr:nth-child(1)').containsText('$5.00');
    assert.dom('tbody tr:nth-child(1)').containsText('Paid');
    assert.dom('tbody tr:nth-child(1) a[href="https://invoice.stripe.com/in_1"]').hasText('View');
    assert.dom('tbody tr:nth-child(1) a[href="https://invoice.stripe.com/in_1.pdf"]').hasText('PDF');
    assert.dom('tbody tr:nth-child(2)').containsText('$15.00');
    assert.dom('tbody tr:nth-child(2)').containsText('Open');
    assert.dom('tbody tr:nth-child(2) a').doesNotExist();
  });

  test('empty', async function (assert) {
    const invoices: never[] = [];

    await render(<template><InvoiceTable @invoices={{invoices}} /></template>);

    assert.dom('table').doesNotExist();
    assert.dom().containsText('No invoices yet');
  });
});
