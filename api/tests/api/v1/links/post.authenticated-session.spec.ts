import { hasUUID, attr, hasAttr, relationship, assertWellFormedLinkData } from '#tests/jsonapi';
import { changedRecords, createNewAccount } from '#tests/db';
import { ApiClient } from '@japa/api-client';
import Link from '#models/link';
import { test } from '@japa/runner';
import User from '#models/user';
import { API_DOMAIN, DOMAIN } from '#start/env';
import { setup } from '#tests/helpers';

test.group('POST [authenticated session]', (group) => {
  setup(group);

  const post = (user: User, client: ApiClient, body = {}) =>
    client
      .post(`http://${API_DOMAIN}/v1/links`)
      .json(body)
      .header('Accept', 'application/vnd.api+json')
      .header('Content-Type', 'application/vnd.api+json')
      .withGuard('web')
      .loginAs(user);

  test('Error: no url', async ({ client }) => {
    let { user } = await createNewAccount();
    let response = await post(user, client, {});

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
    let { user } = await createNewAccount();
    let response = await post(user, client, { originalUrl: '' });

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
    let { user } = await createNewAccount();
    let response = await post(user, client, { originalUrl: 'abcd' });

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

  test('Success: a non-glimdown.com URL (from a free account)', async ({ client, assert }) => {
    let data: any;
    let { user } = await createNewAccount({
      account: {
        isFree: true,
      },
    });
    await changedRecords(Link, async () => {
      let response = await post(user, client, { originalUrl: 'https://google.com' });
      response.assertStatus(201);

      data = response.body().data;
    });

    assertWellFormedLinkData(data);
    hasUUID(data);
    hasAttr(data, 'createdAt');
    hasAttr(data, 'updatedAt');
    assert.include(attr(data, 'shortUrl'), `https://${DOMAIN}`);
    assert.ok(attr(data, 'shortUrl').startsWith(`https://${DOMAIN}`));

    assertWellFormedLinkData(data);

    relationship(data, 'createdBy');
  });

  test('Success: URLs from non-glimdown.com URL requires authentication (from a free account)', async ({
    client,
    assert,
  }) => {
    let data: any;
    let { user, account } = await createNewAccount({
      account: {
        isFree: true,
      },
    });

    await changedRecords(Link, async () => {
      let response = await post(user, client, { originalUrl: 'https://emberjs.com' });

      response.assertStatus(201);

      data = response.body().data;
    });

    assertWellFormedLinkData(data);

    assert.strictEqual(data.relationships.createdBy.id, user.id);
    assert.strictEqual(data.relationships.ownedBy.id, account.id);

    relationship(data, 'createdBy');
  });
});
