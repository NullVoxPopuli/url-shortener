import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import Link from '#models/link';
import { API_DOMAIN } from '#start/env';
import { createLink, createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { v4 as uuidv4 } from 'uuid';

const del = (client: ApiClient, user: User, id: string) =>
  client
    .delete(`http://${API_DOMAIN}/v1/links/${id}`)
    .header('Accept', 'application/vnd.api+json')
    .withGuard('web')
    .loginAs(user);

test.group('DELETE [authenticated session]', (group) => {
  setup(group);

  test('deletes an owned link', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);

    let response = await del(client, user, link.id);

    response.assertStatus(200);
    response.assertBodyContains({ data: null });

    assert.isNull(await Link.find(link.id));
  });

  test("cannot delete another account's link", async ({ client }) => {
    let { user } = await createNewAccount();
    let other = await createNewAccount();
    let victimLink = await createLink(other.user, other.account, 'https://example.com/');

    let response = await del(client, user, victimLink.id);

    /**
     * Same response as deleting a non-existent id: no signal about
     * which ids exist — and the link must survive.
     */
    response.assertStatus(404);

    assert.isNotNull(await Link.find(victimLink.id));
  });

  test('deleting a non-existent id → 404', async ({ client }) => {
    let { user } = await createNewAccount();

    let response = await del(client, user, uuidv4());

    response.assertStatus(404);
  });
});
