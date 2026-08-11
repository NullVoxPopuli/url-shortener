import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { LinksTable } from '#app/routes/dashboard/links-table';
import { makeLink } from '#test-helpers/fixtures';

import type { Link } from '#app/data/types';

module('Rendering | dashboard | LinksTable', function (hooks) {
  setupRenderingTest(hooks);

  test('empty state', async function (assert) {
    const links: Link[] = [];

    await render(
      <template><LinksTable @links={{links}} @watermark={{true}} /></template>
    );

    assert.dom('table').doesNotExist();
    assert.dom().containsText('No links yet');
  });

  test('rows show the short link, visits, and details', async function (assert) {
    const links = [
      makeLink({ visits: 7 }),
      makeLink({ id: 'link-2', shortUrl: 'https://nvp.local/xyz' }),
    ];

    await render(
      <template><LinksTable @links={{links}} @watermark={{true}} /></template>
    );

    assert.dom('tbody tr').exists({ count: 2 });
    assert.dom('a[href="https://nvp.local/abc123"]').exists();
    assert.dom('tbody').containsText('7');

    // original URL is tucked into the per-row details
    assert
      .dom('a[href="https://example.com/a/very/long/path"]')
      .exists({ count: 2 });
  });

  test('no Actions column without @onDelete', async function (assert) {
    const links = [makeLink()];

    await render(
      <template><LinksTable @links={{links}} @watermark={{true}} /></template>
    );

    assert.dom('thead').doesNotContainText('Actions');
    assert.dom('tbody button').doesNotExist();
  });

  test('@onDelete adds a Delete button that receives the link', async function (assert) {
    const links = [makeLink()];
    const onDelete = (link: Link) => assert.step(`delete:${link.id}`);

    await render(
      <template>
        <LinksTable
          @links={{links}}
          @watermark={{true}}
          @onDelete={{onDelete}}
        />
      </template>
    );

    assert.dom('thead').containsText('Actions');

    await click('tbody button');

    assert.verifySteps(['delete:link-1']);
  });

  test('the QR image renders lazily, watermarked for free plans', async function (assert) {
    const links = [makeLink()];

    await render(
      <template><LinksTable @links={{links}} @watermark={{true}} /></template>
    );

    assert.dom('img').doesNotExist('QR not generated until opened');

    const summaries = document.querySelectorAll('summary');
    const qrSummary = [...summaries].find((el) =>
      el.textContent?.includes('View')
    );

    if (!qrSummary) throw new Error('QR summary not found');

    await click(qrSummary);

    assert.dom('img').exists();
    assert
      .dom('img')
      .hasAttribute('alt', 'QR code for https://nvp.local/abc123');

    const src = document.querySelector('img')?.getAttribute('src') ?? '';

    assert.ok(src.startsWith('data:image/svg+xml'), 'QR is an svg data uri');
    assert.ok(src.includes('nvp.gg'), 'free-plan QR carries the watermark');
  });

  test('a paid plan QR has no watermark', async function (assert) {
    const links = [makeLink()];

    await render(
      <template><LinksTable @links={{links}} @watermark={{false}} /></template>
    );

    const summaries = document.querySelectorAll('summary');
    const qrSummary = [...summaries].find((el) =>
      el.textContent?.includes('View')
    );

    if (!qrSummary) throw new Error('QR summary not found');

    await click(qrSummary);

    const src = document.querySelector('img')?.getAttribute('src') ?? '';

    assert.ok(src.startsWith('data:image/svg+xml'), 'QR is an svg data uri');
    assert.notOk(src.includes('nvp.gg'), 'no watermark for paid plans');
  });
});
