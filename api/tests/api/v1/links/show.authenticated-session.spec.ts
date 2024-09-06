import { test } from '@japa/runner';
import { ApiClient } from '@japa/api-client';
import { createLink, createNewAccount } from '#tests/db';
import User from '#models/user';
import { assertWellFormedLinkData } from '#tests/jsonapi';
import { API_DOMAIN } from '#start/env';
import { v4 as uuidv4 } from 'uuid';

const show = (user: User, client: ApiClient, id: string) =>
  client
    .get(`http://${API_DOMAIN}/v1/links/${id}`)
    .header('Accept', 'application/vnd.api+json')
    .withGuard('web')
    .loginAs(user);

test.group('SHOW [authenticated session]', () => {
  test('tries to show a real link', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);
    let response = await show(user, client, link.id);

    response.assertStatus(200);

    let data = response.body().data;

    assertWellFormedLinkData(data);
  });

  test('tries to show something that does not exist', async ({ client }) => {
    let { user } = await createNewAccount();
    let id = uuidv4();
    let response = await show(user, client, id);

    response.assertStatus(404);
    response.assertBody({
      errors: [
        {
          status: 404,
          title: `Link was not found`,
          detail: `Tried to find a Link via ${id}, but could not find anything.`,
        },
      ],
    });
  });

  test('tries to access someone elses Link', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account);
    let neerdowell = await createNewAccount();
    let response = await show(neerdowell.user, client, link.id);

    response.assertStatus(404);
    response.assertBody({
      errors: [
        {
          status: 404,
          title: `Link was not found`,
          detail: `Tried to find a Link via ${link.id}, but could not find anything.`,
        },
      ],
    });
  });
});
