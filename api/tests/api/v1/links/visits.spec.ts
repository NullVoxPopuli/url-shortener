import { test } from '@japa/runner';
import { assert } from 'chai';
import { DateTime } from 'luxon';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import LinkVisit from '#models/link_visit';
import { API_DOMAIN } from '#start/env';
import { createLink, createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { assertUnauthorized } from '#tests/jsonapi';

const getVisits = (client: ApiClient, id: string, user?: User) => {
  const request = client
    .get(`http://${API_DOMAIN}/v1/links/${id}/visits`)
    .header('Accept', 'application/vnd.api+json');

  return user ? request.withGuard('web').loginAs(user) : request;
};

test.group('GET /v1/links/:id/visits', (group) => {
  setup(group);

  test('unauthenticated → 401', async ({ client }) => {
    const { user, account } = await createNewAccount();
    const link = await createLink(user, account);

    const response = await getVisits(client, link.id);

    assertUnauthorized(response);
  });

  test('lists visits for an owned link, most recent first', async ({ client }) => {
    const { user, account } = await createNewAccount();
    const link = await createLink(user, account);

    await LinkVisit.createMany([
      {
        link_id: link.id,
        visitedAt: DateTime.utc().minus({ hours: 2 }),
        referrer: 'https://old.example.com/',
        userAgent: 'older-agent',
      },
      {
        link_id: link.id,
        visitedAt: DateTime.utc(),
        referrer: 'https://new.example.com/',
        userAgent: 'newer-agent',
      },
    ]);

    const response = await getVisits(client, link.id, user);

    response.assertStatus(200);

    const data = response.body().data;

    assert.strictEqual(data.length, 2);
    assert.strictEqual(data[0].type, 'visit');
    assert.strictEqual(data[0].attributes.referrer, 'https://new.example.com/');
    assert.strictEqual(data[1].attributes.referrer, 'https://old.example.com/');
  });

  test("another account's link is a 404", async ({ client }) => {
    const { user } = await createNewAccount();
    const other = await createNewAccount();
    const link = await createLink(other.user, other.account);

    const response = await getVisits(client, link.id, user);

    response.assertStatus(404);
  });
});
