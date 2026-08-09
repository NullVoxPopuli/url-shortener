import { DateTime } from 'luxon';
import { assert } from 'chai';
import LinkVisit from '#models/link_visit';
import Link from '#models/link';
import { createLink, createNewAccount } from '#tests/db';
import { DOMAIN } from '#start/env';
import type { ApiClient } from '@japa/api-client';
import { test } from '@japa/runner';

/**
 * The apex routes are domain-scoped (see start/routes.ts), so the
 * request must carry the apex hostname.
 */
const get = (client: ApiClient, id: string) =>
  client
    .get(`/${id}`)
    .headers({
      Accept: 'text/html',
      Host: DOMAIN,
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

  test('a visit is recorded', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);

    await get(client, link.id);
    await get(client, link.id);

    let fresh = await Link.findOrFail(link.id);

    assert.strictEqual(fresh.visits, 2);

    let visits = await LinkVisit.query().where('link_id', link.id);

    assert.strictEqual(visits.length, 2);
    assert.ok(visits[0].visitedAt);
  });

  test('an expired or unknown link records no visit', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account, {
      expiresAt: DateTime.fromJSDate(new Date('2022-02-02')),
    });

    let response = await get(client, link.id);

    response.assertStatus(404);

    let visits = await LinkVisit.query().where('link_id', link.id);

    assert.strictEqual(visits.length, 0);
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
