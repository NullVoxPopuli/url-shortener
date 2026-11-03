import { test } from '@japa/runner';
import { DOMAIN } from '#start/env';
import type { ApiClient } from '@japa/api-client';

/**
 * The docs routes are domain-scoped, so the request must carry the
 * docs hostname.
 */
const get = (client: ApiClient, path: string) =>
  client.get(path).headers({ Accept: 'text/html', Host: `docs.${DOMAIN}` });

test.group('GET docs legal pages', () => {
  test('/privacy renders the privacy policy', async ({ client }) => {
    const response = await get(client, '/privacy');

    response.assertStatus(200);
    response.assertTextIncludes('Privacy Policy');
    response.assertTextIncludes('Information we collect');
    response.assertTextIncludes('Legalmattic');
  });

  test('/terms renders the terms', async ({ client }) => {
    const response = await get(client, '/terms');

    response.assertStatus(200);
    response.assertTextIncludes('Terms and Conditions');
    response.assertTextIncludes('Fees, payment, and renewal');
    response.assertTextIncludes('Legalmattic');
  });
});
