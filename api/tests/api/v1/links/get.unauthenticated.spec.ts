import { test } from '@japa/runner';
import { ApiClient } from '@japa/api-client';
import { API_DOMAIN } from '#start/env';

const get = (client: ApiClient) =>
  client.get(`http://${API_DOMAIN}/v1/links`).header('Accept', 'application/vnd.api+json');

test.group('GET [unauthenticated]', () => {
  test('must be logged in', async ({ client }) => {
    let response = await get(client);

    response.assertStatus(401);
    response.assertBody({
      errors: [{ code: 'E_UNAUTHORIZED_ACCESS', title: 'Unauthorized access' }],
    });
  });
});
