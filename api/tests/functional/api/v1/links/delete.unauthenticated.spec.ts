import { test } from '@japa/runner';
import { ApiClient } from '@japa/api-client';
import { createLink, createNewAccount } from '#tests/db';

const del = (client: ApiClient, id: string) =>
  client.get(`/v1/links/${id}`).header('Accept', 'application/vnd.api+json');

test.group('DELETE [unauthenticated]', () => {
  test('tries to delete a real link', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);
    let response = await del(client, link.id);

    response.assertStatus(401);
    response.assertBody({
      errors: [{ code: 'E_UNAUTHORIZED_ACCESS', title: 'Unauthorized access' }],
    });
  });

  test('tries to delete something that does not exist', async ({ client }) => {
    let response = await del(client, 'made up id');

    response.assertStatus(401);
    response.assertBody({
      errors: [{ code: 'E_UNAUTHORIZED_ACCESS', title: 'Unauthorized access' }],
    });
  });
});
