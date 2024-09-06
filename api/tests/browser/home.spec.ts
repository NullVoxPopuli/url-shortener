import { test } from '@japa/runner';
import { DOMAIN } from '#start/env';

// `http://${env.get('DOMAIN')}:${env.get('PORT')}`;

/**
 * There is no other public type for this function,
 * but this is the public API, so this is safe to do.
 */
type Visit = Parameters<NonNullable<Parameters<typeof test>[1]>>[0]['visit'];

async function goHome(visit: Visit) {
  const page = await visit('/');
  await page.assertTextContains('h1', 'nvp.gg');

  return {
    page,
    /**
     * TODO: make a helper for creating these
     */
    click: (selector: string) => page.locator(selector).click(),
    fillIn: (selector: string, text: string) => page.locator(selector).fill(text),
    getAttribute: (selector: string, name: string) => page.locator(selector).getAttribute(name),
  };
}

test.group('Creating a link', () => {
  test('glimdown.com URLs are free', async ({ assert, visit }) => {
    const { page, click, fillIn, getAttribute } = await goHome(visit);

    await fillIn('[name=originalUrl]', 'https://limber.glimdown.com?foo');
    await click('button[type=submit]');

    await page.assertTextContains('.create-success', 'Congratulations');
    let href = await getAttribute('.short-url-content a', 'href');

    assert.match(href || '<null>', new RegExp(`^https://${DOMAIN}/`));
  });

  test('Other domains require login', async ({ assert, visit }) => {
    const { page, click, fillIn } = await goHome(visit);

    await fillIn('[name=originalUrl]', 'https://other.domain.com?foo');
    await click('button[type=submit]');

    let errorsText = await page.innerText('.errors');

    assert.strictEqual(errorsText, 'Shortening that URL requires an account. Please login.');
  });
});
