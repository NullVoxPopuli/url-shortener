import { render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { SubscriptionCard } from '#app/routes/dashboard/index/subscription-card';
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
      planKey: 'hobby',
      planName: 'Hobby',
      monthlyLinkLimit: 100,
      remaining: 98,
      used: 2,
      hasActiveSubscription: true,
    });

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert.dom('section').containsText('Hobby');
    assert.dom('section').containsText('Current period:');
    assert.dom('button').containsText('Manage billing');
    assert.dom('a[href="/pricing"]').doesNotExist();
  });

  test('scheduled cancellation is called out', async function (assert) {
    const billing = makeBilling({
      planKey: 'hobby',
      planName: 'Hobby',
      hasActiveSubscription: true,
      cancelAtPeriodEnd: true,
    });

    await render(<template><SubscriptionCard @billing={{billing}} /></template>);

    assert.dom('section').containsText('Cancellation is scheduled');
  });
});
