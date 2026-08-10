import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import ApiKeyTable from '#app/routes/dashboard/api-keys/api-key-table';
import NewApiKey from '#app/routes/dashboard/api-keys/new-api-key';
import { makeApiKey } from '#test-helpers/fixtures';

import type { ApiKey } from '#app/data/types';

module('Rendering | dashboard | ApiKeyTable', function (hooks) {
  setupRenderingTest(hooks);

  const noop = () => {};

  test('empty state', async function (assert) {
    const keys: ApiKey[] = [];

    await render(
      <template><ApiKeyTable @keys={{keys}} @onRevoke={{noop}} /></template>
    );

    assert.dom('table').doesNotExist();
    assert.dom().containsText('No API keys yet');
  });

  test('rows show name, scopes, and expiry states', async function (assert) {
    const keys = [
      makeApiKey({ scopes: ['links:read', 'links:write'] }),
      makeApiKey({
        id: 'key-2',
        name: 'Old one',
        expiresAt: '2020-01-01T00:00:00.000Z',
      }),
      makeApiKey({
        id: 'key-3',
        name: 'Future one',
        expiresAt: '2099-01-01T00:00:00.000Z',
        lastUsedAt: '2026-08-08T00:00:00.000Z',
      }),
    ];

    await render(
      <template><ApiKeyTable @keys={{keys}} @onRevoke={{noop}} /></template>
    );

    assert.dom('tbody tr').exists({ count: 3 });
    assert.dom('tbody').containsText('links:read, links:write');
    assert.dom('tbody').containsText('Never');
    assert.dom('.warning').containsText('Expired');
    assert.dom('tbody').containsText('Future one');
  });

  test('revoking passes the key along', async function (assert) {
    const keys = [makeApiKey()];
    const onRevoke = (key: ApiKey) => assert.step(`revoke:${key.id}`);

    await render(
      <template><ApiKeyTable @keys={{keys}} @onRevoke={{onRevoke}} /></template>
    );

    await click('tbody button');

    assert.verifySteps(['revoke:key-1']);
  });

  test('the new-key banner shows the secret exactly once', async function (assert) {
    await render(
      <template>
        <NewApiKey @name="CI deploys" @token="nvp_abc123_secret" />
      </template>
    );

    assert.dom('[role="status"]').containsText('CI deploys');
    assert.dom('code').hasText('nvp_abc123_secret');
    assert.dom('[role="status"]').containsText('only time the key is shown');
    assert.dom('button').hasText('Copy');
  });
});
