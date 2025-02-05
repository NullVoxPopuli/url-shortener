import { relationship, assertWellFormedLinkData, clientFor } from '#tests/jsonapi';
import { changedRecords } from '#tests/db';
import Link from '#models/link';
import { test } from '@japa/runner';
import { API_DOMAIN } from '#start/env';
import { assert } from 'chai';
import { setup } from '#tests/helpers';

const ENDPOINT = `http://${API_DOMAIN}/v1/links`;

test.group('POST [unauthenticated]', (group) => {
  setup(group);

  test('Error: no url', async ({ client }) => {
    let response = await clientFor(client, ENDPOINT).post({});

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
    let response = await clientFor(client, ENDPOINT).post({ originalUrl: '' });

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
    let response = await clientFor(client, ENDPOINT).post({ originalUrl: 'abcd' });

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
    let response = await clientFor(client, ENDPOINT).post({ originalUrl: 'https://google.com' });

    response.assertStatus(401);
    response.assertBody({
      errors: [
        {
          status: 401,
          title: 'Authentication required',
          detail: 'You are not logged in and / or did not provide an API key.',
        },
      ],
    });
  });

  test('Success: URLs from glimdown.com are always allowed', async ({ client }) => {
    let data: any;
    await changedRecords(Link, async () => {
      let response = await clientFor(client, ENDPOINT).post({
        originalUrl: 'https://glimdown.com',
      });

      response.assertStatus(201);

      data = response.body().data;
    });

    assertWellFormedLinkData(data);

    relationship(data, 'createdBy');
  });

  test('Success: URLs from limber.glimdown.com are always allowed', async ({ client }) => {
    let data: any;
    await changedRecords(Link, async () => {
      let response = await clientFor(client, ENDPOINT).post({
        originalUrl: 'https://limber.glimdown.com',
      });

      response.assertStatus(201);

      data = response.body().data;
    });

    assertWellFormedLinkData(data);

    relationship(data, 'createdBy');

    let id = data.id;

    let link = await Link.query().preload('ownedBy').where('id', '=', id).first();

    assert.ok(link?.owned_by);
    assert.ok(link?.ownedBy.id);
    assert.ok(link?.ownedBy.isFree);
  });

  test('Success: The same URL shortened twice results in the same short URL', async ({
    assert,
    client,
  }) => {
    let first;
    let second;
    let url = 'https://limber.glimdown.com';

    {
      let response = await clientFor(client, ENDPOINT).post({ originalUrl: url });
      response.assertStatus(201);

      first = response.body().data;
    }
    {
      let response = await clientFor(client, ENDPOINT).post({ originalUrl: url });
      response.assertStatus(201);

      second = response.body().data;
    }

    assert.strictEqual(first.shortUrl, second.shortUrl);
    assert.notStrictEqual(
      first.id,
      second.id,
      `The ids don't need to match, because when looking up the shortURL to find the long URL, it's the same. `
    );
  });
});
