import { render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { UsageCard } from '#app/routes/dashboard/index/usage-card';
import { makeBilling } from '#test-helpers/fixtures';

module('Rendering | dashboard | UsageCard', function (hooks) {
  setupRenderingTest(hooks);

  test('a limited plan shows usage and a meter', async function (assert) {
    const billing = makeBilling({ used: 2, remaining: 3 });

    await render(<template><UsageCard @billing={{billing}} /></template>);

    assert.dom('section').containsText('2 of 5 links used this month');
    assert.dom('[role="progressbar"]').hasAttribute('aria-valuenow', '2');
    assert.dom('[role="progressbar"]').hasAttribute('aria-valuemax', '5');
    assert.dom('section').containsText('3 remaining until');
    // period boundaries are UTC moments, rendered as such
    assert.dom('section').containsText('11:59 PM UTC');
  });

  test('an exhausted quota warns with the reset time', async function (assert) {
    const billing = makeBilling({ used: 5, remaining: 0 });

    await render(<template><UsageCard @billing={{billing}} /></template>);

    assert.dom('section').containsText("You've used your quota for this month");
    assert.dom('section').containsText('It resets on');
    assert.dom('section').doesNotContainText('remaining until');
  });

  test('an unlimited plan shows no meter', async function (assert) {
    const billing = makeBilling({
      planKey: 'free',
      planName: 'Free',
      monthlyLinkLimit: null,
      used: 12,
      remaining: null,
    });

    await render(<template><UsageCard @billing={{billing}} /></template>);

    assert.dom('section').containsText('12 links created this month');
    assert.dom('section').containsText('Unlimited links');
    assert.dom('[role="progressbar"]').doesNotExist();
  });
});
