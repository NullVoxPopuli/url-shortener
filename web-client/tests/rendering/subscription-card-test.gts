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

    assert.dom('section').containsText('No subscription');
    assert.dom('section').containsText('starter allowance of 5 links per month');
    assert.dom('a[href="/pricing"]').exists();
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

    assert.dom('section').containsText('Free account');
    assert.dom('section').containsText('Unlimited links');
    assert.dom('button').doesNotExist();
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

  test('a scheduled downgrade says so, and that the current plan stays', async function (assert) {
    const billing = makeBilling({
      planKey: 'pro',
      planName: 'Pro',
      hasActiveSubscription: true,
      pendingChange: {
        kind: 'downgrade',
        plan: {
          key: 'base',
          name: 'Base',
          monthlyLinkLimit: 15,
          linkEditsPerMonth: 0,
          linkExpiration: false,
        },
        at: 1788264000,
      },
    });

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert.dom('[data-test-downgrading]').containsText('Downgrading to Base on Sep 1, 2026');
    assert.dom('[data-test-downgrading]').containsText('You keep Pro until then');
    assert.dom('.plan-name').hasText('Pro');
  });

  test('a scheduled upgrade says so', async function (assert) {
    const billing = makeBilling({
      planKey: 'base',
      planName: 'Base',
      hasActiveSubscription: true,
      pendingChange: {
        kind: 'upgrade',
        plan: {
          key: 'pro',
          name: 'Pro',
          monthlyLinkLimit: 1000,
          linkEditsPerMonth: 50,
          linkExpiration: true,
        },
        at: 1788264000,
      },
    });

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert.dom('[data-test-upgrading]').containsText('Upgrading to Pro on Sep 1, 2026');
  });
});
