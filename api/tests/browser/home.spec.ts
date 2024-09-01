import { test } from '@japa/runner';
import env, { DOMAIN } from '#start/env';

const PORT = env.get('PORT');

/**
 * There is no other public type for this function,
 * but this is the public API, so this is safe to do.
 */
type Visit = Parameters<NonNullable<Parameters<typeof test>[1]>>[0]['visit'];

async function goHome(visit: Visit) {
  const page = await visit(`http://${DOMAIN}:${PORT}/`);
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

test.group('Home', () => {
  test('Create a limber REPL URL', async ({ assert, visit }) => {
    const { page, click, fillIn, getAttribute } = await goHome(visit);

    await fillIn('[name=originalUrl]', 'https://limber.glimdown.com?foo');
    await click('button[type=submit]');

    await page.assertTextContains('.create-success', 'Congratulations');
    let href = await getAttribute('.short-url-content a', 'href');

    assert.match(href || '<null>', new RegExp(`^https://${DOMAIN}/`));
  });
});

test.group('vistiing a short link', () => {
  test('Link does not exist', async ({ assert, visit }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains(404);
  });

  test('Link exists', async ({ assert, visit }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertUrl(`Original URL`);
  });

  test('Link exists, but the owning account is unpaid', async ({ assert, visit }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains(404);
  });

  test('Link exists, but is expired', async ({ assert, visit }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains(404);
  });

  test('Link is from a free account', async ({ assert, visit }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains(404);
  });

  test('Link exists twice from different accounts', async ({ assert, visit }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains(404);
  });

  test('Link exists twice from different accounts and one is expired', async ({
    assert,
    visit,
  }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains(404);
  });

  test('Link exists twice from different accounts and they are all expired', async ({
    assert,
    visit,
  }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains(404);
  });

  test('Link exists three times from different accounts: valid/unpaid/expired', async ({
    assert,
    visit,
  }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains(404);
  });
});

