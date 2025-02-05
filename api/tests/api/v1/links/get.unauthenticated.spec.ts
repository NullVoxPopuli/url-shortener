import { test } from '@japa/runner';
import { ApiClient } from '@japa/api-client';
import { API_DOMAIN } from '#start/env';
import { setup } from '#tests/helpers';
import { assertUnauthorized } from '#tests/jsonapi';

const get = (client: ApiClient) =>
  client.get(`http://${API_DOMAIN}/v1/links`).header('Accept', 'application/vnd.api+json');

test.group('GET [unauthenticated]', (group) => {
  setup(group);

  test('must be logged in', async ({ client }) => {
    let response = await get(client);

    assertUnauthorized(response);
  });
});
