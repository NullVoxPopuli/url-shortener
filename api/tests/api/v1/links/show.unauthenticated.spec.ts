import { test } from '@japa/runner';
import { ApiClient } from '@japa/api-client';
import { createLink, createNewAccount } from '#tests/db';
import { API_DOMAIN } from '#start/env';
import { v4 as uuidv4 } from 'uuid';

const show = (client: ApiClient, id: string) =>
  client.get(`http://${API_DOMAIN}/v1/links/${id}`).header('Accept', 'application/vnd.api+json');
import { setup } from '#tests/helpers';
import { assertUnauthorized } from '#tests/jsonapi';

test.group('SHOW [unauthenticated]', (group) => {
  setup(group);

  test('tries to show a real link', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);
    let response = await show(client, link.id);

    assertUnauthorized(response);
  });

  test('tries to show something that does not exist', async ({ client }) => {
    let id = uuidv4();
    let response = await show(client, `made up ${id}`);

    assertUnauthorized(response);
  });
});
