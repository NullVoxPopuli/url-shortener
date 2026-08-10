import { test } from '@japa/runner';
import { assert } from 'chai';
import { DateTime } from 'luxon';
import type { ApiClient } from '@japa/api-client';
import type User from '#models/user';
import AccountInvitation from '#models/account_invitation';
import AccountMembership from '#models/account_membership';
import { API_DOMAIN } from '#start/env';
import { createNewAccount } from '#tests/db';
import { setup } from '#tests/helpers';
import { assertUnauthorized } from '#tests/jsonapi';

const jsonHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

const getMemberships = (client: ApiClient, accountId: string, user?: User) => {
  const request = client
    .get(`http://${API_DOMAIN}/v1/accounts/${accountId}/memberships`)
    .headers(jsonHeaders);

  return user ? request.withGuard('web').loginAs(user) : request;
};

const invite = (client: ApiClient, accountId: string, user: User) =>
  client
    .post(`http://${API_DOMAIN}/v1/accounts/${accountId}/invitations`)
    .headers(jsonHeaders)
    .withGuard('web')
    .loginAs(user);

const accept = (client: ApiClient, token: string, user: User) =>
  client
    .post(`http://${API_DOMAIN}/v1/invitations/accept`)
    .json({ token })
    .headers(jsonHeaders)
    .withGuard('web')
    .loginAs(user);

test.group('Team | memberships + invitations', (group) => {
  setup(group);

  test('memberships: unauthenticated → 401', async ({ client }) => {
    const { account } = await createNewAccount();

    assertUnauthorized(await getMemberships(client, account.id));
  });

  test('memberships: members see the list with user info included', async ({ client }) => {
    const { user, account } = await createNewAccount();
    const response = await getMemberships(client, account.id, user);

    response.assertStatus(200);

    const body = response.body();

    assert.strictEqual(body.data.length, 1);
    assert.strictEqual(body.data[0].type, 'membership');
    assert.strictEqual(body.data[0].attributes.role, 'admin');
    assert.strictEqual(body.included[0].type, 'user');
    assert.strictEqual(body.included[0].attributes.name, user.name);
  });

  test('memberships: non-members get a 404', async ({ client }) => {
    const { account } = await createNewAccount();
    const outsider = await createNewAccount();

    const response = await getMemberships(client, account.id, outsider.user);

    response.assertStatus(404);
  });

  test('invite + accept: full flow on an unlimited (free) account', async ({ client }) => {
    const { user, account } = await createNewAccount({ account: { isFree: true } });
    const invitee = await createNewAccount();

    const created = await invite(client, account.id, user);

    created.assertStatus(201);

    const { token, acceptUrl } = created.body().data.attributes;

    assert.ok(token);
    assert.include(acceptUrl, `/join/${token}`);

    const accepted = await accept(client, token, invitee.user);

    accepted.assertStatus(201);
    assert.strictEqual(accepted.body().data.attributes.role, 'member');

    const membership = await AccountMembership.query()
      .where('account_id', account.id)
      .where('user_id', invitee.user.id)
      .first();

    assert.ok(membership);

    // accepting again is idempotent
    const again = await accept(client, token, invitee.user);

    again.assertStatus(200);
  });

  test('invite: plans without teammates → 402', async ({ client }) => {
    const { user, account } = await createNewAccount();

    const response = await invite(client, account.id, user);

    response.assertStatus(402);
    assert.strictEqual(response.body().errors[0].title, 'Teammate limit reached');
  });

  test('invite: non-admin members cannot invite', async ({ client }) => {
    const { account } = await createNewAccount({ account: { isFree: true } });
    const member = await createNewAccount();

    await AccountMembership.ensure({ accountId: account.id, userId: member.user.id });

    const response = await invite(client, account.id, member.user);

    response.assertStatus(404);
  });

  test('accept: unknown or expired tokens → 404', async ({ client }) => {
    const { user, account } = await createNewAccount({ account: { isFree: true } });
    const invitee = await createNewAccount();

    const bad = await accept(client, 'ffffffff-ffff-4fff-8fff-ffffffffffff', invitee.user);

    bad.assertStatus(404);

    const expired = await AccountInvitation.create({
      account_id: account.id,
      invited_by: user.id,
      role: 'member',
      expiresAt: DateTime.utc().minus({ days: 1 }),
    });

    const late = await accept(client, expired.token, invitee.user);

    late.assertStatus(404);
  });

  test('remove: members can leave, owners cannot be removed', async ({ client }) => {
    const { user, account } = await createNewAccount({ account: { isFree: true } });
    const member = await createNewAccount();

    const membership = await AccountMembership.ensure({
      accountId: account.id,
      userId: member.user.id,
    });

    const leave = await client
      .delete(`http://${API_DOMAIN}/v1/memberships/${membership.id}`)
      .headers(jsonHeaders)
      .withGuard('web')
      .loginAs(member.user);

    leave.assertStatus(200);

    assert.isNull(await AccountMembership.find(membership.id));

    // the personal-account pointer never changes
    await member.user.refresh();
    assert.strictEqual(member.user.account_id, member.account.id);

    // the owner's membership is permanent (404: nothing removable)
    const ownerMembership = await AccountMembership.query()
      .where('account_id', account.id)
      .where('user_id', user.id)
      .firstOrFail();

    const removeOwner = await client
      .delete(`http://${API_DOMAIN}/v1/memberships/${ownerMembership.id}`)
      .headers(jsonHeaders)
      .withGuard('web')
      .loginAs(user);

    removeOwner.assertStatus(404);
    assert.isNotNull(await AccountMembership.find(ownerMembership.id));
  });

  test('revoke: admins can revoke pending invitations', async ({ client }) => {
    const { user, account } = await createNewAccount({ account: { isFree: true } });

    const created = await invite(client, account.id, user);
    const id = created.body().data.id;

    const revoke = await client
      .delete(`http://${API_DOMAIN}/v1/invitations/${id}`)
      .headers(jsonHeaders)
      .withGuard('web')
      .loginAs(user);

    revoke.assertStatus(200);
    assert.isNull(await AccountInvitation.find(id));
  });
});
