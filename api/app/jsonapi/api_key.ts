import type { AccessToken } from '@adonisjs/auth/access_tokens';

function data(key: AccessToken, secret?: string) {
  return {
    type: 'api-key',
    id: String(key.identifier),
    attributes: {
      name: key.name,
      scopes: key.abilities,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      /**
       * The secret is only ever present in the create response — it
       * cannot be retrieved again afterwards.
       */
      ...(secret ? { token: secret } : {}),
    },
  };
}

export function apiKey(key: AccessToken, options?: { secret?: string }) {
  return { data: data(key, options?.secret) };
}

export function apiKeys(list: AccessToken[], meta?: unknown) {
  return {
    ...(meta ? { meta } : {}),
    data: list.map((key) => data(key)),
  };
}
