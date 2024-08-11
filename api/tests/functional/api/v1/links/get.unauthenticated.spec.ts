import { test } from '@japa/runner';
import { ApiClient } from '@japa/api-client';

const get = (client: ApiClient) =>
  client.get(`_/api/v1/links`).header('Accept', 'application/vnd.api+json');

test.group('GET [unauthenticated]', () => {
  test('must be logged in', async ({ client }) => {
    let response = await get(client);

    response.assertStatus(401);
    response.assertBody({ errors: [{ message: 'Unauthorized access' }] });
  });
});