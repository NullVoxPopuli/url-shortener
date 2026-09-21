import { render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { UsageCard } from '#app/routes/dashboard/index/usage-card.gts';
import { makeBilling } from '#test-helpers/fixtures';

module('Rendering | dashboard | UsageCard', function (hooks) {
  setupRenderingTest(hooks);

  test('a limited plan shows usage and a meter', async function (assert) {
    const billing = makeBilling({ used: 2, remaining: 3 });

    await render(<template><UsageCard @billing={{billing}} /></template>);

    assert.dom('section').containsText('2 of 5 free links used this month');
    assert.dom('[data-test-free-hint] a').hasAttribute('href', '/pricing');
    assert.dom('[role="progressbar"]').hasAttribute('aria-valuenow', '2');
    assert.dom('[role="progressbar"]').hasAttribute('aria-valuemax', '5');
    assert.dom('section').containsText('3 remaining until');
    // period boundaries are UTC moments, rendered as such
    assert.dom('section').containsText('11:59 PM UTC');
  });

  test('an exhausted quota warns with the reset time', async function (assert) {
    const billing = makeBilling({ used: 5, remaining: 0 });

    await render(<template><UsageCard @billing={{billing}} /></template>);

    assert.dom('[data-test-free-exhausted]').containsText("You've used all 5 free links this month");
    assert.dom('[data-test-free-exhausted] a').hasAttribute('href', '/pricing');
    assert.dom('section').containsText('or wait until');
    assert.dom('section').doesNotContainText('remaining until');
  });

  test('an unlimited plan shows no meter', async function (assert) {
    const billing = makeBilling({
      planKey: 'internal',
      planName: 'Internal',
      monthlyLinkLimit: null,
      used: 12,
      remaining: null,
    });

    await render(<template><UsageCard @billing={{billing}} /></template>);

    assert.dom('section').containsText('12 links created this month');
    assert.dom('section').containsText('Unlimited links');
    assert.dom('[role="progressbar"]').doesNotExist();
  });

  test('a paid plan at its limit points at the reset, not at pricing', async function (assert) {
    const billing = makeBilling({
      planKey: 'pro',
      planName: 'Pro',
      monthlyLinkLimit: 1000,
      used: 1000,
      remaining: 0,
      hasActiveSubscription: true,
    });

    await render(<template><UsageCard @billing={{billing}} /></template>);

    assert.dom('section').containsText("You've used your quota for this month");
    assert.dom('a[href="/pricing"]').doesNotExist();
  });
});
