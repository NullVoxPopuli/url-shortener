import type { HttpContext } from '@adonisjs/core/http';
import AccountMembership from '#models/account_membership';
import { notFound, paymentRequired, unprocessable } from '#exceptions/api_errors';
import { apiKey, apiKeys } from '#jsonapi/api_key';
import { accountContext } from '#services/account_context';
import { API_KEY_SCOPES, apiKeyCapacity } from '#services/api_keys';
import { membershipFor } from '#services/team';

import type { ApiKeyScope } from '#services/api_keys';

const MAX_NAME_LENGTH = 100;
const MAX_EXPIRES_IN_DAYS = 3650;

/**
 * Managing keys requires a browser session (a key cannot mint or
 * revoke keys), and operates on the caller's own membership in the
 * context account.
 */
async function membershipContext(context: HttpContext) {
  let user = await context.auth.use('web').authenticate();
  let account = await accountContext(context, user);

  if (!account) {
    throw notFound('Account', String(context.request.input('accountId')));
  }

  let membership = await membershipFor(user.id, account.id);

  if (!membership) {
    throw notFound('Account', account.id);
  }

  return { account, membership };
}

export async function listApiKeys(context: HttpContext) {
  let { account, membership } = await membershipContext(context);

  let keys = await AccountMembership.apiKeys.all(membership);
  let capacity = await apiKeyCapacity(account);

  context.response.status(200);

  return apiKeys(keys, capacity);
}

export async function createApiKey(context: HttpContext) {
  let { account, membership } = await membershipContext(context);
  let { request, response } = context;

  let name = String(request.input('name') ?? '').trim();

  if (!name || name.length > MAX_NAME_LENGTH) {
    throw unprocessable(`A name is required (at most ${MAX_NAME_LENGTH} characters).`);
  }

  let rawScopes = request.input('scopes');

  if (!Array.isArray(rawScopes) || rawScopes.length === 0) {
    throw unprocessable(
      `"scopes" must be a non-empty array. Valid scopes: ${API_KEY_SCOPES.join(', ')}`
    );
  }

  let scopes: ApiKeyScope[] = [];

  for (let raw of new Set(rawScopes.map(String))) {
    if (!API_KEY_SCOPES.includes(raw as ApiKeyScope)) {
      throw unprocessable(
        `"${raw}" is not a valid scope. Valid scopes: ${API_KEY_SCOPES.join(', ')}`
      );
    }

    scopes.push(raw as ApiKeyScope);
  }

  let rawDays = request.input('expiresInDays');
  let expiresInDays: number | null = null;

  if (rawDays !== undefined && rawDays !== null && rawDays !== '') {
    let days = Number(rawDays);

    if (!Number.isInteger(days) || days < 1 || days > MAX_EXPIRES_IN_DAYS) {
      throw unprocessable(
        `"expiresInDays" must be a whole number between 1 and ${MAX_EXPIRES_IN_DAYS}.`
      );
    }

    expiresInDays = days;
  }

  let capacity = await apiKeyCapacity(account);

  if (capacity.remaining !== null && capacity.remaining <= 0) {
    throw paymentRequired(
      'API key limit reached',
      capacity.limit === 0
        ? 'Your plan does not include API keys. Upgrade to create one.'
        : `Your plan includes ${capacity.limit} API key(s).`
    );
  }

  let key = await AccountMembership.apiKeys.create(membership, scopes, {
    name,
    ...(expiresInDays ? { expiresIn: `${expiresInDays} days` } : {}),
  });

  response.status(201);

  return apiKey(key, { secret: key.value!.release() });
}

export async function revokeApiKey(context: HttpContext) {
  let { membership } = await membershipContext(context);
  let rawId = context.request.param('id');
  let id = Number(rawId);

  let key = Number.isInteger(id) ? await AccountMembership.apiKeys.find(membership, id) : null;

  if (!key) {
    throw notFound('ApiKey', String(rawId));
  }

  await AccountMembership.apiKeys.delete(membership, key.identifier);

  context.response.status(200);

  return context.jsonApi.render(null);
}
