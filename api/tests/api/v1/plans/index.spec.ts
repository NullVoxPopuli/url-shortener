import { test } from '@japa/runner';
import { assert } from 'chai';
import { API_DOMAIN } from '#start/env';
import { PLANS } from '#services/plans';
import { setup } from '#tests/helpers';

test.group('GET /v1/plans', (group) => {
  setup(group);

  test('lists the paid plans without authentication', async ({ client }) => {
    const response = await client
      .get(`http://${API_DOMAIN}/v1/plans`)
      .header('Accept', 'application/vnd.api+json');

    response.assertStatus(200);

    const { data } = response.body();

    assert.deepEqual(
      data.map((plan: { id: string; type: string }) => [plan.type, plan.id]),
      [
        ['plan', 'base'],
        ['plan', 'essentials'],
        ['plan', 'pro'],
        ['plan', 'vast'],
      ]
    );

    const vast = data[3].attributes;
    assert.strictEqual(vast.name, 'Vast');
    assert.strictEqual(vast.prices.month.amountInCents, PLANS[3].prices.month.amountInCents);
    assert.strictEqual(vast.prices.year.amountInCents, PLANS[3].prices.year.amountInCents);
    assert.strictEqual(vast.monthlyLinkLimit, PLANS[3].monthlyLinkLimit);
    assert.isTrue(vast.linkExpiration);
  });
});
