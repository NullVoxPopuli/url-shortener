import type { DataResponse } from '#jsonapi';
import type User from '#models/user';
import { API_ORIGIN } from '#start/env';
import { account } from './account.js';

/**
 * Public shape only: oauth ids/tokens are never serialized.
 *
 * When the account relation is preloaded, it is sideloaded
 * (`included`) for full linkage.
 */
export function user(user: User): DataResponse {
  let included = user.account ? [account(user.account).data] : undefined;

  return {
    ...(included ? { included } : {}),
    data: {
      type: 'user',
      id: user.id,
      attributes: {
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      relationships: {
        account: {
          data: { type: 'account', id: user.account_id },
          links: { related: `${API_ORIGIN}/v1/accounts/${user.account_id}` },
        },
      },
    },
  };
}
