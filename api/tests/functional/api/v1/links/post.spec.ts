import { ApiClient } from '@japa/api-client';
import { test } from '@japa/runner';

const post = (client: ApiClient, body = {}) => client.post('_/api/v1/links').json(body);

test.group('POST v1/links', () => {
  test('Error: no url', async ({ client }) => {
    let response = await post(client, {});

    response.assertStatus(422);
    response.assertBody({
      data: {},
    });
  });

  test('Error: missing url', async ({ client }) => {
    let response = await post(client, { originalUrl: '' });

    response.assertStatus(422);
    response.assertBody({
      data: {},
    });
  });

  test('Error: malformed url', async ({ client }) => {
    let response = await post(client, { originalUrl: 'abcd' });

    response.assertStatus(422);
    response.assertBody({
      data: {},
    });
  });

  test('Error: any non-glimdown.com URL requires authentication', async ({ client }) => {
    let response = await post(client, { originalUrl: 'https://google.com' });

    response.assertStatus(401);
    response.assertBody({
      data: {},
    });
  });

  test('Success: URLs from glimdown.com are always allowed', async ({ client }) => {
    let response = await post(client, { originalUrl: 'https://glimdown.com' });

    response.assertStatus(201);
    response.assertBody({
      data: {},
    });
  });
});
