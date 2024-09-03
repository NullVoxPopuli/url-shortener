import { test } from '@japa/runner';
import { compressedUUID } from '@nullvoxpopuli/url-compression';
import { createLink, createNewAccount } from '#tests/db';

test.group('vistiing a short link', () => {
  test('Link does not exist', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link exists via id', async ({ visit }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);

    let page = await visit(`/${link.id}`);

    await page.assertUrlContains(link.original);
  });

  test('Link exists via compressedUUID', async ({ visit }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);
    let shorter = compressedUUID.encode(link.id);
    let page = await visit(`/${shorter}`);

    await page.assertUrlContains(link.original);
  });

  test('Link exists, but the owning account is unpaid', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    /**
     * We don't reveal that an account is unpaid, could be rude
     */
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link exists, but is expired', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link is from a free account', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertUrlContains('boop boop');
  }).skip(true, 'Free accounts not implemented yet');

  test('Link exists twice from different accounts', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertUrlContains('google.com');
  });

  test('Link exists twice from different accounts and one is expired', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertUrlContains('google.com');
  });

  test('Link exists twice from different accounts and they are all expired', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link exists three times from different accounts: valid/unpaid/expired', async ({
    visit,
  }) => {
    let page = await visit(`/google`);
    await page.assertUrlContains('google.com');
  }).skip(true, `We don't have account paid/unpaid status yet.`);
});
