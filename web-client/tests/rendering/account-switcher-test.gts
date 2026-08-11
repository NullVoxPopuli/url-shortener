import Service from '@ember/service';
import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { PortalTargets } from 'ember-primitives';

import { AccountSwitcher } from '#app/routes/dashboard/account-switcher';

const PERSONAL = 'aaaaaaaa-1111-2222-3333-444444444444';
const TEAM = 'bbbbbbbb-1111-2222-3333-444444444444';

function stubCurrentUser(owner: object, memberships: Array<{ accountId: string; accountName: string }>) {
  class StubCurrentUser extends Service {
    memberships = memberships;
  }

  (owner as { register: (name: string, factory: unknown) => void }).register(
    'service:current-user',
    StubCurrentUser
  );
}

module('Rendering | dashboard | AccountSwitcher', function (hooks) {
  setupRenderingTest(hooks);

  test('a single membership renders a plain name, no menu', async function (assert) {
    stubCurrentUser(this.owner, [{ accountId: PERSONAL, accountName: 'NullVoxPopuli' }]);

    await render(
      <template><AccountSwitcher @accountId={{PERSONAL}} /></template>
    );

    assert.dom('button').doesNotExist();
    assert.dom().containsText('NullVoxPopuli');
  });

  test('multiple memberships open a menu of account links', async function (assert) {
    stubCurrentUser(this.owner, [
      { accountId: PERSONAL, accountName: 'NullVoxPopuli' },
      { accountId: TEAM, accountName: 'glimdown' },
    ]);

    await render(
      <template>
        <PortalTargets />
        <AccountSwitcher @accountId={{PERSONAL}} />
      </template>
    );

    // the trigger shows the active account
    assert.dom('button').hasText('NullVoxPopuli');

    await click('button');

    assert.dom(`a[href="/${PERSONAL.slice(0, 8)}"]`).exists();
    assert.dom(`a[href="/${TEAM.slice(0, 8)}"]`).hasText('glimdown');
    assert.dom(`a[href="/${PERSONAL.slice(0, 8)}"]`).hasAttribute('aria-current', 'true');
    assert.dom(`a[href="/${TEAM.slice(0, 8)}"]`).doesNotHaveAttribute('aria-current');
  });
});
