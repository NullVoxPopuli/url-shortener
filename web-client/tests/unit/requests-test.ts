import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { checkout } from '@warp-drive/core/reactive';

import { createLink, deleteLink, getLinks, updateLink } from '#app/data/requests';
import { pushLink } from '#test-helpers/store';

import type { Store } from '@warp-drive/core';
import type { Link } from '#app/data/types';

/**
 * The api routes these methods and paths; the builders must match them.
 */
module('Unit | data | requests', function (hooks) {
  setupTest(hooks);

  test('getLinks is a GET on /v1/links scoped to the account', function (assert) {
    const init = getLinks('acct-1');

    assert.strictEqual(init.method, 'GET');
    // the builder sorts the include list
    assert.strictEqual(
      init.url,
      'http://api.nvp.local/v1/links?accountId=acct-1&include=createdBy%2CownedBy'
    );
    assert.deepEqual(init.cacheOptions?.types, ['link']);
  });

  test('updateLink is a PATCH with only the changed fields', async function (assert) {
    const store = this.owner.lookup('service:store') as Store;
    const link = pushLink(this.owner, { id: 'link-1', original: 'https://example.com/old' });
    const editable = await checkout<Link>(link);

    editable.original = 'https://example.com/new';

    const init = updateLink(store, editable, 'acct-1');

    assert.strictEqual(init.method, 'PATCH');
    assert.strictEqual(
      init.url,
      'http://api.nvp.local/v1/links/link-1?accountId=acct-1&include=ownedBy,createdBy'
    );
    assert.deepEqual(JSON.parse(init.body as string), {
      data: { type: 'link', id: 'link-1', attributes: { original: 'https://example.com/new' } },
    });
  });

  test('createLink is a POST without a client id', function (assert) {
    const store = this.owner.lookup('service:store') as Store;
    const init = createLink(store, { original: 'https://example.com/a' }, 'acct-1');
    const body = JSON.parse(init.body as string) as { data: Record<string, unknown> };

    assert.strictEqual(init.method, 'POST');
    assert.strictEqual(
      init.url,
      'http://api.nvp.local/v1/links?accountId=acct-1&include=ownedBy,createdBy'
    );
    assert.strictEqual(body.data.type, 'link');
    assert.notOk('id' in body.data, 'no id');
    assert.notOk('lid' in body.data, 'no lid');
    assert.deepEqual(body.data.attributes, { original: 'https://example.com/a', domain: null });
  });

  test('deleteLink is a DELETE on the link', function (assert) {
    const link = pushLink(this.owner, { id: 'link-1' });
    const init = deleteLink(link, 'acct-1');

    assert.strictEqual(init.method, 'DELETE');
    assert.strictEqual(init.url, 'http://api.nvp.local/v1/links/link-1?accountId=acct-1');
  });
});
