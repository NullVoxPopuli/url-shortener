import type { DataResponse } from '#jsonapi';
import type Account from '#models/account';
import { API_ORIGIN } from '#start/env';
import { user } from './user.js';

/**
 * Public shape only: billing/stripe details stay on the
 * authenticated billing endpoints.
 *
 * When the admin relation is preloaded, it is sideloaded (`included`)
 * for full linkage.
 */
export function account(account: Account): DataResponse {
  let included = account.admin ? [user(account.admin).data] : undefined;

  return {
    ...(included ? { included } : {}),
    data: {
      type: 'account',
      id: account.id,
      attributes: {
        name: account.name,
        isFree: account.isFree,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      relationships: {
        admin: {
          data: { type: 'user', id: account.admin_id },
          links: { related: `${API_ORIGIN}/v1/users/${account.admin_id}` },
        },
      },
    },
  };
}
