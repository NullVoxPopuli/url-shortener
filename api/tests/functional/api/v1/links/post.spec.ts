import { hasUUID, hasRelationship, attr, hasAttr } from '#tests/jsonapi';
import { ApiClient } from '@japa/api-client';
import { test } from '@japa/runner';

const post = (client: ApiClient, body = {}) => client.post('_/api/v1/links').json(body);

test.group('POST v1/links', () => {
  test('Error: no url', async ({ client }) => {
    let response = await post(client, {});

    response.assertStatus(422);
    response.assertBody({
      errors: [
        {
          status: 422,
          title: 'Missing URL',
        },
      ],
    });
  });

  test('Error: missing url', async ({ client }) => {
    let response = await post(client, { originalUrl: '' });

    response.assertStatus(422);
    response.assertBody({
      errors: [
        {
          status: 422,
          title: 'Missing URL',
        },
      ],
    });
  });

  test('Error: malformed url', async ({ client }) => {
    let response = await post(client, { originalUrl: 'abcd' });

    response.assertStatus(422);
    response.assertBody({
      errors: [
        {
          status: 422,
          title: 'Cannot parse URL, check the URL',
        },
      ],
    });
  });

  test('Error: any non-glimdown.com URL requires authentication', async ({ client }) => {
    let response = await post(client, { originalUrl: 'https://google.com' });

    response.assertStatus(401);
    response.assertBody({
      errors: [
        {
          status: 401,
          title: 'Authentication required',
        },
      ],
    });
  });

  test('Success: URLs from glimdown.com are always allowed', async ({ client, assert }) => {
    let response = await post(client, { originalUrl: 'https://glimdown.com' });

    response.assertStatus(201);

    let data = response.body().data;

    hasUUID(data);
    hasAttr(data, 'createdAt');
    hasAttr(data, 'updatedAt');
    assert.ok(attr(data, 'shortUrl').startsWith('localhost'));

    hasRelationship(data, 'createdBy', 'user');
    hasRelationship(data, 'ownedBy', 'account');
  });
});
