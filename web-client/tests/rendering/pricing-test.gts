import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { PlanCards } from '#app/routes/pricing/pricing.gts';
import { makeBilling, makePlan } from '#test-helpers/fixtures';

module('Rendering | pricing | PlanCards', function (hooks) {
  setupRenderingTest(hooks);

  test('a visitor without a session sees prices and sign-in links', async function (assert) {
    const plans = [makePlan({ id: 'base', key: 'base', name: 'Base' }), makePlan()];
    const checkout = () => assert.step('checkout');

    await render(
      <template>
        <PlanCards
          @plans={{plans}}
          @billing={{null}}
          @interval="month"
          @isSubmitting={{false}}
          @checkout={{checkout}}
        />
      </template>
    );

    assert.dom('article').exists({ count: 2 });
    assert.dom('[data-plan="pro"] .price').hasText('$15/month');
    assert.dom('[data-plan="pro"] a[href="/auth/login"]').containsText('Sign in to choose Pro');
    assert.dom('button').doesNotExist();
    assert.verifySteps([]);
  });

  test('the yearly interval shows the yearly price', async function (assert) {
    const plans = [makePlan()];
    const checkout = () => assert.step('checkout');

    await render(
      <template>
        <PlanCards
          @plans={{plans}}
          @billing={{null}}
          @interval="year"
          @isSubmitting={{false}}
          @checkout={{checkout}}
        />
      </template>
    );

    assert.dom('[data-plan="pro"] .price').hasText('$165/year');
  });

  test('a signed-in visitor without a subscription can choose a plan', async function (assert) {
    const plans = [makePlan()];
    const billing = makeBilling();
    const checkout = (key: string) => assert.step(`checkout:${key}`);

    await render(
      <template>
        <PlanCards
          @plans={{plans}}
          @billing={{billing}}
          @interval="month"
          @isSubmitting={{false}}
          @checkout={{checkout}}
        />
      </template>
    );

    await click('[data-plan="pro"] button');

    assert.verifySteps(['checkout:pro']);
  });

  test('a subscriber sees the current plan marked and no buttons', async function (assert) {
    const plans = [makePlan({ id: 'base', key: 'base', name: 'Base' }), makePlan()];
    const billing = makeBilling({ planKey: 'pro', planName: 'Pro', hasActiveSubscription: true });
    const checkout = () => assert.step('checkout');

    await render(
      <template>
        <PlanCards
          @plans={{plans}}
          @billing={{billing}}
          @interval="month"
          @isSubmitting={{false}}
          @checkout={{checkout}}
        />
      </template>
    );

    assert.dom('[data-plan="pro"]').containsText('Your current plan');
    assert.dom('[data-plan="base"]').doesNotContainText('Your current plan');
    assert.dom('button').doesNotExist();
    assert.dom('a[href="/auth/login"]').doesNotExist();
  });
});
