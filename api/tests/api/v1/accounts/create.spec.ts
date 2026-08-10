import { test } from '@japa/runner';
import { assert } from 'chai';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import Account from '#models/account';
import AccountMembership from '#models/account_membership';
import { API_DOMAIN } from '#start/env';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { doc } from '#tests/jsonapi';
import { overridePlan } from '#services/plan_override';

const jsonHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

const create = (client: ApiClient, user: User, name: string) =>
  client
    .post(`http://${API_DOMAIN}/v1/accounts`)
    .json(doc('account', { name }))
    .headers(jsonHeaders)
    .withGuard('web')
    .loginAs(user);

test.group('POST /v1/accounts (additional accounts)', (group) => {
  setup(group);

  test('unpaid personal accounts cannot create additional accounts', async ({ client }) => {
    const { user } = await createNewAccount();

    const response = await create(client, user, 'Side Project');

    response.assertStatus(402);
    assert.strictEqual(response.body().errors[0].title, 'Additional account limit reached');
  });

  test('side-hobby allows one additional account', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'side-hobby');

    const first = await create(client, user, 'Side Project');

    first.assertStatus(201);

    const data = first.body().data;

    assert.strictEqual(data.attributes.name, 'Side Project');

    const created = await Account.findOrFail(data.id);

    assert.isFalse(Boolean(created.isPersonal));

    const membership = await AccountMembership.query()
      .where('account_id', created.id)
      .where('user_id', user.id)
      .firstOrFail();

    assert.strictEqual(membership.role, 'admin');

    const second = await create(client, user, 'One Too Many');

    second.assertStatus(402);
  });

  test('project allows three additional accounts', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'project');

    for (const name of ['One', 'Two', 'Three']) {
      const response = await create(client, user, name);

      response.assertStatus(201);
    }

    const fourth = await create(client, user, 'Four');

    fourth.assertStatus(402);
  });

  test('account names are validated', async ({ client }) => {
    const { user, account } = await createNewAccount();

    await overridePlan(account, 'side-hobby');

    const response = await create(client, user, 'x');

    response.assertStatus(422);
  });
});
