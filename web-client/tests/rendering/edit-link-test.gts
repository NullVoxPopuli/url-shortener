import { click, fillIn, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { EditLinkForm } from '#app/routes/dashboard/edit-link-form.gts';
import { LinksTable } from '#app/routes/dashboard/links-table.gts';
import { makeLink } from '#test-helpers/fixtures';

import type { Link } from '#app/data/types';
import type { LinkChanges } from '#app/routes/dashboard/edit-link-form.gts';
import type { LinkEditing } from '#app/routes/dashboard/links-table.gts';

function editing(overrides?: Partial<LinkEditing>): LinkEditing {
  return {
    id: null,
    remaining: null,
    canSetExpiration: true,
    start: () => {},
    cancel: () => {},
    save: () => {},
    ...overrides,
  };
}

module('Rendering | dashboard | EditLinkForm', function (hooks) {
  setupRenderingTest(hooks);

  test('saves only what changed', async function (assert) {
    const link = makeLink({ original: 'https://example.com/old', expiresAt: null });
    const onSave = (changes: LinkChanges) => assert.step(JSON.stringify(changes));
    const onCancel = () => assert.step('cancel');

    await render(
      <template>
        <EditLinkForm
          @link={{link}}
          @canSetExpiration={{true}}
          @isSaving={{false}}
          @onSave={{onSave}}
          @onCancel={{onCancel}}
        />
      </template>
    );

    assert.dom('input[name="original"]').hasValue('https://example.com/old');
    assert.dom('input[name="expiresAt"]').hasValue('');

    await fillIn('input[name="original"]', 'https://example.com/new');
    await click('button[type="submit"]');

    assert.verifySteps(['{"original":"https://example.com/new"}']);
  });

  test('an expiration date means the end of that day, UTC', async function (assert) {
    const link = makeLink({ expiresAt: '2026-10-01T23:59:59.000Z' });
    const onSave = (changes: LinkChanges) => assert.step(JSON.stringify(changes));
    const onCancel = () => assert.step('cancel');

    await render(
      <template>
        <EditLinkForm
          @link={{link}}
          @canSetExpiration={{true}}
          @isSaving={{false}}
          @onSave={{onSave}}
          @onCancel={{onCancel}}
        />
      </template>
    );

    assert.dom('input[name="expiresAt"]').hasValue('2026-10-01');

    await fillIn('input[name="expiresAt"]', '2026-12-31');
    await click('button[type="submit"]');

    assert.verifySteps(['{"expiresAt":"2026-12-31T23:59:59.000Z"}']);
  });

  test('clearing the date sends null', async function (assert) {
    const link = makeLink({ expiresAt: '2026-10-01T23:59:59.000Z' });
    const onSave = (changes: LinkChanges) => assert.step(JSON.stringify(changes));
    const onCancel = () => assert.step('cancel');

    await render(
      <template>
        <EditLinkForm
          @link={{link}}
          @canSetExpiration={{true}}
          @isSaving={{false}}
          @onSave={{onSave}}
          @onCancel={{onCancel}}
        />
      </template>
    );

    await fillIn('input[name="expiresAt"]', '');
    await click('button[type="submit"]');

    assert.verifySteps(['{"expiresAt":null}']);
  });

  test('no expiration input when the plan has none', async function (assert) {
    const link = makeLink();
    const onSave = () => assert.step('save');
    const onCancel = () => assert.step('cancel');

    await render(
      <template>
        <EditLinkForm
          @link={{link}}
          @canSetExpiration={{false}}
          @isSaving={{false}}
          @onSave={{onSave}}
          @onCancel={{onCancel}}
        />
      </template>
    );

    assert.dom('input[name="expiresAt"]').doesNotExist();

    // nothing changed: submitting is the same as cancelling
    await click('button[type="submit"]');

    assert.verifySteps(['cancel']);
  });
});

module('Rendering | dashboard | LinksTable editing', function (hooks) {
  setupRenderingTest(hooks);

  test('@editing adds an Edit button that starts editing the link', async function (assert) {
    const links = [makeLink({ id: 'link-1' })];
    const options = editing({ start: (link: Link) => assert.step(`start:${link.id}`) });

    await render(
      <template>
        <LinksTable @links={{links}} @watermark={{true}} @editing={{options}} />
      </template>
    );

    assert.dom('th').exists({ count: 6 });
    assert.dom('.edit-button').isEnabled();

    await click('.edit-button');

    assert.verifySteps(['start:link-1']);
    assert.dom('.editor-row').doesNotExist();
  });

  test('the editor row opens for the link whose id is being edited', async function (assert) {
    const links = [makeLink({ id: 'link-1' }), makeLink({ id: 'link-2' })];
    const options = editing({
      id: 'link-2',
      save: (link: Link, changes: LinkChanges) =>
        assert.step(`save:${link.id}:${JSON.stringify(changes)}`),
    });

    await render(
      <template>
        <LinksTable @links={{links}} @watermark={{true}} @editing={{options}} />
      </template>
    );

    assert.dom('.editor-row').exists({ count: 1 });
    assert.dom('.editor-row td').hasAttribute('colspan', '6');

    await fillIn('.editor-row input[name="original"]', 'https://example.com/changed');
    await click('.editor-row button[type="submit"]');

    assert.verifySteps(['save:link-2:{"original":"https://example.com/changed"}']);
  });

  test('no edits left disables the Edit button', async function (assert) {
    const links = [makeLink()];
    const options = editing({ remaining: 0 });

    await render(
      <template>
        <LinksTable @links={{links}} @watermark={{true}} @editing={{options}} />
      </template>
    );

    assert.dom('.edit-button').isDisabled();
    assert.dom('.edit-button').hasAttribute('title', /No link edits left/);
  });
});
