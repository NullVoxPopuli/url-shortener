import { test } from '@japa/runner';
import { assert } from 'chai';
import { DateTime } from 'luxon';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import Link from '#models/link';
import LinkEdit from '#models/link_edit';
import { API_DOMAIN } from '#start/env';
import { createLink, createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { overridePlan } from '#services/plan_override';
import { PLANS } from '#services/plans';
import { v4 as uuidv4 } from 'uuid';

const PROJECT = PLANS[2];

const patch = (client: ApiClient, user: User, id: string, attributes: Record<string, unknown>) =>
  client
    .patch(`http://${API_DOMAIN}/v1/links/${id}`)
    .json({ data: { type: 'link', id, attributes } })
    .header('Accept', 'application/vnd.api+json')
    .header('Content-Type', 'application/vnd.api+json')
    .withGuard('web')
    .loginAs(user);

const getStatus = (client: ApiClient, user: User) =>
  client
    .get(`http://${API_DOMAIN}/v1/billing/status`)
    .header('Accept', 'application/vnd.api+json')
    .withGuard('web')
    .loginAs(user);

async function projectAccount() {
  let { user, account } = await createNewAccount();

  await overridePlan(account, PROJECT.key);

  return { user, account };
}

test.group('PATCH /v1/links/:id [authenticated session]', (group) => {
  setup(group);

  test('changes the destination and records the edit', async ({ client }) => {
    let { user, account } = await projectAccount();
    let link = await createLink(user, account, 'https://example.com/old');

    let response = await patch(client, user, link.id, { original: 'https://example.com/new' });

    response.assertStatus(200);
    assert.strictEqual(response.body().data.attributes.original, 'https://example.com/new');

    let edits = await LinkEdit.query().where('link_id', link.id);
    assert.lengthOf(edits, 1);
    assert.strictEqual(edits[0].previousOriginal, 'https://example.com/old');
    assert.strictEqual(edits[0].account_id, account.id);
    assert.strictEqual(edits[0].edited_by, user.id);
  });

  test('sets and clears the expiration', async ({ client }) => {
    let { user, account } = await projectAccount();
    let link = await createLink(user, account);
    let expiresAt = DateTime.utc().plus({ days: 30 }).startOf('second');

    let response = await patch(client, user, link.id, { expiresAt: expiresAt.toISO() });

    response.assertStatus(200);
    assert.strictEqual(
      DateTime.fromISO(response.body().data.attributes.expiresAt).toMillis(),
      expiresAt.toMillis()
    );

    response = await patch(client, user, link.id, { expiresAt: null });

    response.assertStatus(200);
    assert.isNull(response.body().data.attributes.expiresAt);
    assert.lengthOf(await LinkEdit.query().where('link_id', link.id), 2);
  });

  test('the edit shows up in billing usage', async ({ client }) => {
    let { user, account } = await projectAccount();
    let link = await createLink(user, account);

    await patch(client, user, link.id, { original: 'https://example.com/new' });

    let response = await getStatus(client, user);
    let usage = response.body().data.attributes.usage;

    assert.strictEqual(usage.editsUsed, 1);
    assert.strictEqual(usage.editsRemaining, PROJECT.linkEditsPerMonth - 1);
    assert.strictEqual(response.body().data.attributes.plan.linkEditsPerMonth, 50);
    assert.isTrue(response.body().data.attributes.plan.linkExpiration);
  });

  test('a plan without edits → 402, link unchanged', async ({ client }) => {
    let { user, account } = await createNewAccount();
    let link = await createLink(user, account, 'https://example.com/old');

    let response = await patch(client, user, link.id, { original: 'https://example.com/new' });

    response.assertStatus(402);

    let unchanged = await Link.findOrFail(link.id);
    assert.strictEqual(unchanged.original, 'https://example.com/old');
    assert.lengthOf(await LinkEdit.query().where('link_id', link.id), 0);
  });

  test('a plan at its monthly edit limit → 402', async ({ client }) => {
    let { user, account } = await projectAccount();
    let link = await createLink(user, account, 'https://example.com/old');

    for (let i = 0; i < PROJECT.linkEditsPerMonth; i++) {
      await LinkEdit.create({
        link_id: link.id,
        account_id: account.id,
        edited_by: user.id,
        previousOriginal: 'https://example.com/old',
        previousExpiresAt: null,
      });
    }

    let response = await patch(client, user, link.id, { original: 'https://example.com/new' });

    response.assertStatus(402);

    let unchanged = await Link.findOrFail(link.id);
    assert.strictEqual(unchanged.original, 'https://example.com/old');
  });

  test('a plan without expiration → 402 for expiresAt', async ({ client }) => {
    let { user, account } = await createNewAccount({ account: { isFree: false } });
    let link = await createLink(user, account);

    // the free (legacy) plan edits without limit but is the only unpaid plan with expiration,
    // so use a paid plan without it
    await overridePlan(account, PLANS[1].key);

    let response = await patch(client, user, link.id, {
      expiresAt: DateTime.utc().plus({ days: 1 }).toISO(),
    });

    response.assertStatus(402);
    assert.lengthOf(await LinkEdit.query().where('link_id', link.id), 0);
  });

  test('a legacy free account edits without limits', async ({ client }) => {
    let { user, account } = await createNewAccount({ account: { isFree: true } });
    let link = await createLink(user, account);

    let response = await patch(client, user, link.id, {
      original: 'https://example.com/new',
      expiresAt: DateTime.utc().plus({ days: 1 }).toISO(),
    });

    response.assertStatus(200);

    let status = await getStatus(client, user);
    assert.isNull(status.body().data.attributes.usage.editsRemaining);
  });

  test('no change spends no edit', async ({ client }) => {
    let { user, account } = await projectAccount();
    let link = await createLink(user, account, 'https://example.com/same');

    let response = await patch(client, user, link.id, { original: 'https://example.com/same' });

    response.assertStatus(200);
    assert.lengthOf(await LinkEdit.query().where('link_id', link.id), 0);
  });

  test('an unparseable URL → 422', async ({ client }) => {
    let { user, account } = await projectAccount();
    let link = await createLink(user, account);

    let response = await patch(client, user, link.id, { original: 'not a url' });

    response.assertStatus(422);
  });

  test('an expiration in the past → 422', async ({ client }) => {
    let { user, account } = await projectAccount();
    let link = await createLink(user, account);

    let response = await patch(client, user, link.id, {
      expiresAt: DateTime.utc().minus({ days: 1 }).toISO(),
    });

    response.assertStatus(422);
  });

  test("cannot edit another account's link", async ({ client }) => {
    let { user } = await projectAccount();
    let other = await createNewAccount();
    let victim = await createLink(other.user, other.account, 'https://example.com/old');

    let response = await patch(client, user, victim.id, { original: 'https://example.com/new' });

    response.assertStatus(404);

    let unchanged = await Link.findOrFail(victim.id);
    assert.strictEqual(unchanged.original, 'https://example.com/old');
  });

  test('a non-existent id → 404', async ({ client }) => {
    let { user } = await projectAccount();

    let response = await patch(client, user, uuidv4(), { original: 'https://example.com/new' });

    response.assertStatus(404);
  });

  test('unauthenticated → 401', async ({ client }) => {
    let { user, account } = await projectAccount();
    let link = await createLink(user, account);

    let response = await client
      .patch(`http://${API_DOMAIN}/v1/links/${link.id}`)
      .json({ data: { type: 'link', id: link.id, attributes: { original: 'https://x.com' } } })
      .header('Accept', 'application/vnd.api+json')
      .header('Content-Type', 'application/vnd.api+json');

    response.assertStatus(401);
  });
});
