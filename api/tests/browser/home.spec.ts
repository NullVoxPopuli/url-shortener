import { test } from '@japa/runner';
import { compressedUUID } from '@nullvoxpopuli/url-compression';
import { createLink, createNewAccount } from '#tests/db';
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

test.group('vistiing a short link', () => {
  test('Link does not exist', async ({ assert, visit }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link exists via id', async ({ assert, visit }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);
    let page = await visit(`http://${DOMAIN}:${PORT}/${link.id}`);
    console.log(await page.innerText('body'));
    await page.assertUrl(`Original URL`);
  });

  test('Link exists via compressedUUID', async ({ assert, visit }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);
    let shorter = compressedUUID.encode(link.id);
    let page = await visit(`http://${DOMAIN}:${PORT}/${shorter}`);

    await page.assertUrl(`Original URL`);
  });

  test('Link exists, but the owning account is unpaid', async ({ assert, visit }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    /**
     * We don't reveal that an account is unpaid, could be rude
     */
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link exists, but is expired', async ({ assert, visit }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link is from a free account', async ({ assert, visit }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains(404);
  }).skip(true, 'Free accounts not implemented yet');

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
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link exists three times from different accounts: valid/unpaid/expired', async ({
    assert,
    visit,
  }) => {
    let page = await visit(`http://${DOMAIN}:${PORT}/does-not-exist`);
    await page.assertTextContains(404);
  }).skip(true, `We don't have account paid/unpaid status yet.`);
});

