import { setup } from '#tests/helpers';
import { test } from '@japa/runner';

/**
 * Only failure cases are tested here, because
 * playwright acts like a user, and doesn't have a way to
 * halt redirects from happening.
 */
test.group('vistiing a short link', (group) => {
  setup(group);

  test('Link does not exist', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertTextContains('h1', `could not expand that URL`);
  });

  test('Link exists, but the owning account is unpaid', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    /**
     * We don't reveal that an account is unpaid, could be rude
     */
    await page.assertTextContains('h1', `could not expand that URL`);
  }).skip(true, 'Account management not implemented');

  test('Link exists twice from different accounts and one is expired', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertUrlContains('google.com');
  }).skip(true, 'TODO');

  test('Link exists twice from different accounts and they are all expired', async ({ visit }) => {
    let page = await visit(`/does-not-exist`);
    await page.assertTextContains('h1', `could not expand that URL`);
  }).skip(true, 'TODO');

  test('Link exists three times from different accounts: valid/unpaid/expired', async ({
    visit,
  }) => {
    let page = await visit(`/google`);
    await page.assertUrlContains('google.com');
  }).skip(true, `We don't have account paid/unpaid status yet.`);
});
