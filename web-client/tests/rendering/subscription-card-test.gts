import { render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { SubscriptionCard } from '#app/routes/dashboard/index/subscription-card.gts';
import { makeBilling } from '#test-helpers/fixtures';

module('Rendering | dashboard | SubscriptionCard', function (hooks) {
  setupRenderingTest(hooks);

  test('no subscription: starter allowance + pricing link', async function (assert) {
    const billing = makeBilling();

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert.dom('[data-test-free-plan]').hasText('Free');
    assert.dom('.plan-includes').containsText('5 links a month');
    assert.dom('.plan-includes').containsText('Watermarked QR codes');
    assert.dom('section').containsText('No card on file');
    assert.dom('[data-test-upgrade]').hasAttribute('href', '/pricing');
    assert.dom('button').doesNotExist();
  });

  test('free account: unlimited, no billing button', async function (assert) {
    const billing = makeBilling({
      planKey: 'free',
      planName: 'Free',
      monthlyLinkLimit: null,
      remaining: null,
    });

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert.dom('[data-test-legacy-free]').hasText('Free, unlimited');
    assert.dom('section').containsText('legacy account');
    assert.dom('button').doesNotExist();
    assert.dom('a[href="/pricing"]').doesNotExist();
  });

  test('active subscription: plan, period, manage button', async function (assert) {
    const billing = makeBilling({
      planKey: 'essentials',
      planName: 'Essentials',
      monthlyLinkLimit: 100,
      remaining: 98,
      used: 2,
      hasActiveSubscription: true,
    });

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert.dom('section').containsText('Essentials');
    assert.dom('section').containsText('Current period:');
    assert.dom('button').containsText('Manage billing');
    assert.dom('a[href="/pricing"]').doesNotExist();
  });

  test('a cancellation says so, with the end date', async function (assert) {
    const billing = makeBilling({
      planKey: 'essentials',
      planName: 'Essentials',
      hasActiveSubscription: true,
      cancelAtPeriodEnd: true,
    });

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert.dom('[data-test-cancelling]').containsText('Cancelling');
    assert.dom('[data-test-cancelling]').containsText('Essentials plan ends Sep 1, 2026');
  });

  test('a downgrade in progress names both plans and the date', async function (assert) {
    const billing = makeBilling({
      planKey: 'pro',
      planName: 'Pro',
      hasActiveSubscription: true,
      pendingDowngrade: {
        plan: {
          key: 'base',
          name: 'Base',
          monthlyLinkLimit: 15,
          linkEditsPerMonth: 0,
          linkExpiration: false,
        },
        at: 1788264000,
        overages: [],
      },
    });

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert.dom('.plan-name').hasText('Pro');
    assert.dom('[data-test-downgrading]').hasText('Pro until Sep 1, 2026, then Base.');
    assert.dom('[data-test-overages]').doesNotExist();
  });

  test('a downgrade in progress warns about the limits the account is over', async function (assert) {
    const billing = makeBilling({
      planKey: 'pro',
      planName: 'Pro',
      hasActiveSubscription: true,
      pendingDowngrade: {
        plan: {
          key: 'base',
          name: 'Base',
          monthlyLinkLimit: 15,
          linkEditsPerMonth: 0,
          linkExpiration: false,
        },
        at: 1788264000,
        overages: [
          { resource: 'links', used: 40, limit: 15 },
          { resource: 'customDomains', used: 2, limit: 0 },
        ],
      },
    });

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert
      .dom('[data-test-overages]')
      .hasText("Over Base's limits: 40 links this month (limit 15), 2 custom domains (limit 0).");
  });

  test('the glimdown account is named as the shared one, with no actions', async function (assert) {
    const billing = makeBilling({
      planKey: 'free',
      planName: 'Free',
      monthlyLinkLimit: null,
      remaining: null,
      isGlimdown: true,
    });

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert.dom('[data-test-glimdown]').hasText('Glimdown');
    assert.dom('section').containsText('without signing in');
    assert.dom('section').doesNotContainText('legacy');
    assert.dom('[data-test-actions]').doesNotExist();
  });
});
