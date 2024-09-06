import { test } from '@japa/runner';
import { ApiClient } from '@japa/api-client';
import { createLink, createNewAccount } from '#tests/db';
import { API_DOMAIN } from '#start/env';
import { v4 as uuidv4 } from 'uuid';

const show = (client: ApiClient, id: string) =>
  client.get(`http://${API_DOMAIN}/v1/links/${id}`).header('Accept', 'application/vnd.api+json');

test.group('SHOW [unauthenticated]', () => {
  test('tries to show a real link', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);
    let response = await show(client, link.id);

    response.assertStatus(401);
    response.assertBody({
      errors: [{ code: 'E_UNAUTHORIZED_ACCESS', title: 'Unauthorized access' }],
    });
  });

  test('tries to show something that does not exist', async ({ client }) => {
    let id = uuidv4();
    let response = await show(client, `made up ${id}`);

    response.assertStatus(401);
    response.assertBody({
      errors: [{ code: 'E_UNAUTHORIZED_ACCESS', title: 'Unauthorized access' }],
    });
  });
});
