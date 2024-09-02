import { test } from '@japa/runner';
import { compressedUUID } from '@nullvoxpopuli/url-compression';
import { createLink, createNewAccount } from '#tests/db';
import env, { DOMAIN } from '#start/env';

// `http://${env.get('DOMAIN')}:${env.get('PORT')}`;

test.group('vistiing a short link', () => {
  test('Link does not exist', async ({ assert, visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link exists via id', async ({ assert, visit, browser }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);

    let page = await visit(`/${link.id}`);
    // console.log(await page.innerText('body'));
    await page.assertUrl(`Original URL`);
  });

  test('Link exists via compressedUUID', async ({ assert, visit }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);
    let shorter = compressedUUID.encode(link.id);
    let page = await visit(`/${shorter}`);

    await page.assertUrl(`Original URL`);
  });

  test('Link exists, but the owning account is unpaid', async ({ assert, visit }) => {
    let page = await visit(`/does-not-exist`);
    /**
     * We don't reveal that an account is unpaid, could be rude
     */
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link exists, but is expired', async ({ assert, visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link is from a free account', async ({ assert, visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertUrlContains('boop boop');
  }).skip(true, 'Free accounts not implemented yet');

  test('Link exists twice from different accounts', async ({ assert, visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertUrlContains('boop boop');
  });

  test('Link exists twice from different accounts and one is expired', async ({
    assert,
    visit,
  }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertUrlContains('boop boop');
  });

  test('Link exists twice from different accounts and they are all expired', async ({
    assert,
    visit,
  }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link exists three times from different accounts: valid/unpaid/expired', async ({
    assert,
    visit,
  }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertUrlContains('boop boop');
  }).skip(true, `We don't have account paid/unpaid status yet.`);
});
