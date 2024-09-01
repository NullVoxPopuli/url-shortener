import { test } from '@japa/runner';
import { DOMAIN } from '#start/env';

test.group('Home', () => {
  test('Create a limber REPL URL', async ({ assert, visit }) => {
    const page = await visit(`http://${DOMAIN}/`);
    console.log(await page.innerText('body'));
    await page.assertTextContains('h1', 'nvp.gg');
    await page.assertExists(page.locator('h1', { hasText: 'nvp.gg' }));

    const input = page.locator('[name=originalUrl]');
    const submit = page.locator('button[type=submit]');

    await input.fill('https://limber.glimdown.com?foo');
    await submit.click();

    await page.assertExists(page.locator('.create-success', { hasText: 'Congratulations' }));
  });
});

