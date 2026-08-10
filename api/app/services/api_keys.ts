import type { HttpContext } from '@adonisjs/core/http';
import Account from '#models/account';
import AccountMembership from '#models/account_membership';
import User from '#models/user';
import { jsonapi } from '#jsonapi';
import type { Response } from '#jsonapi';
import { accountContext } from './account_context.js';
import { planFor } from './plans.js';

export const API_KEY_SCOPES = ['links:read', 'links:write'] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

/**
 * How many more API keys the account's plan allows. Keys belong to
 * memberships, but the quota is account-wide — the account's plan
 * (paid for by its owner) sets how many keys may exist across all
 * members. Expired keys do not count against the quota.
 */
export async function apiKeyCapacity(account: Account) {
  const plan = planFor(account);
  const limit = plan.apiKeys;

  const memberships = await AccountMembership.query().where('account_id', account.id);

  let used = 0;

  for (const membership of memberships) {
    const keys = await AccountMembership.apiKeys.all(membership);

    used += keys.filter((key) => !key.isExpired()).length;
  }

  return {
    limit,
    used,
    remaining: limit === null ? null : Math.max(limit - used, 0),
  };
}

type Authenticated = {
  user: User;
  account: Account;
  membership: AccountMembership | null;
  viaApiKey: boolean;
};

type Failed = { response: Response };

/**
 * Session-or-API-key authentication for the links endpoints.
 *
 * - Browser sessions have every scope and pick their account the
 *   usual way (the `account` input, membership-checked).
 * - API keys must carry the required scope, and are pinned to their
 *   membership's account — an `account` input naming any other
 *   account 404s.
 *
 * Returns null when no credentials were presented at all.
 */
export async function maybeAuthenticateWithScope(
  context: HttpContext,
  scope: ApiKeyScope
): Promise<Authenticated | Failed | null> {
  if (await context.auth.use('web').check()) {
    let user = context.auth.use('web').user!;
    let account = await accountContext(context, user);

    if (!account) {
      return {
        response: jsonapi.notFound({
          kind: 'Account',
          id: String(context.request.input('accountId')),
        }),
      };
    }

    return { user, account, membership: null, viaApiKey: false };
  }

  if (!context.request.header('authorization')) {
    return null;
  }

  let membership = await context.auth
    .use('api')
    .authenticate()
    .catch(() => null);

  if (!membership) {
    return {
      response: jsonapi.notAuthenticated({
        stack: 'This API key is not valid (it may have been revoked or expired).',
      }),
    };
  }

  let token = membership.currentAccessToken;

  if (!token.allows(scope)) {
    return {
      response: jsonapi.notAuthorized({
        stack: `This API key does not have the "${scope}" scope.`,
      }),
    };
  }

  let requested = context.request.input('accountId');

  if (requested && String(requested) !== membership.account_id) {
    return {
      response: jsonapi.notFound({ kind: 'Account', id: String(requested) }),
    };
  }

  let account = await Account.find(membership.account_id);
  let user = await User.find(membership.user_id);

  if (!account || !user) {
    return {
      response: jsonapi.notFound({ kind: 'Account', id: membership.account_id }),
    };
  }

  return { user, account, membership, viaApiKey: true };
}

/**
 * Like maybeAuthenticateWithScope, but anonymous requests fail with
 * a 401 instead of returning null.
 */
export async function authenticateWithScope(
  context: HttpContext,
  scope: ApiKeyScope
): Promise<Authenticated | Failed> {
  let result = await maybeAuthenticateWithScope(context, scope);

  if (result) return result;

  return {
    response: jsonapi.notAuthenticated({
      stack: 'Log in, or provide an API key via `Authorization: Bearer nvp_...`',
    }),
  };
}
