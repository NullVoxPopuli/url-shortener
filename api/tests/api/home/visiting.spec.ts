import { DateTime } from 'luxon';
import { createLink, createNewAccount } from '#tests/db';
import { ApiClient } from '@japa/api-client';
import { test } from '@japa/runner';

const get = (client: ApiClient, id: string) =>
  client
    .get(`/${id}`)
    .headers({
      Accept: 'text/html',
    })
    .redirects(0);

test.group('GET /:link', () => {
  test(':link is the id', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);

    let response = await get(client, link.id);

    response.assertStatus(308);
    response.assertHeader('location', link.original);
  });

  test(':link is the comppssedUUID', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);

    let response = await get(client, link.encodedId);

    response.assertStatus(308);
    response.assertHeader('location', link.original);
  });

  test(':link is expired', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account, {
      expiresAt: DateTime.fromJSDate(new Date('2022-02-02')),
    });

    let response = await get(client, link.encodedId);

    response.assertStatus(404);
  });

  test(':link has a duplicate from two different accounts', async ({ assert, client }) => {
    let one = await createNewAccount();
    let two = await createNewAccount();
    let fakeUrl = 'https://whatever-this-is.com';
    let link1 = await createLink(one.user, one.account, { original: fakeUrl });
    let link2 = await createLink(two.user, two.account, { original: fakeUrl });

    assert.notStrictEqual(
      link1.encodedId,
      link2.encodedId,
      'encoded uuids are not the same, because this is based off the unique id generated for the db record'
    );

    let response = await get(client, link2.encodedId);

    response.assertStatus(308);
    response.assertHeader('location', link1.original);
  });
});
