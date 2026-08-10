import type { DataResponse } from '#jsonapi';
import type AccountMembership from '#models/account_membership';
import { API_ORIGIN } from '#start/env';
import { account } from './account.js';
import { user } from './user.js';

/**
 * Full linkage for modern clients: every relationship in the doc has
 * its resource `included` — the member's user, the account, and the
 * account's admin (when preloaded).
 */
function includedFor(membership: AccountMembership) {
  let resources = new Map<string, unknown>();
  let add = (resource: unknown) => {
    let record = resource as { type: string; id: string };

    resources.set(`${record.type}:${record.id}`, resource);
  };

  if (membership.user) add(user(membership.user).data);

  if (membership.account) {
    let doc = account(membership.account);

    for (let resource of doc.included ?? []) add(resource);
    add(doc.data);
  }

  return resources;
}

function data(membership: AccountMembership) {
  return {
    type: 'membership',
    id: String(membership.id),
    attributes: {
      role: membership.role,
      createdAt: membership.createdAt,
    },
    relationships: {
      user: {
        data: { type: 'user', id: membership.user_id },
        links: { related: `${API_ORIGIN}/v1/users/${membership.user_id}` },
      },
      account: {
        data: { type: 'account', id: membership.account_id },
        links: { related: `${API_ORIGIN}/v1/accounts/${membership.account_id}` },
      },
    },
  };
}

export function membership(membership: AccountMembership): DataResponse {
  let included = includedFor(membership);

  return {
    ...(included.size ? { included: [...included.values()] } : {}),
    data: data(membership),
  };
}

export function memberships(list: AccountMembership[]) {
  let included = new Map<string, unknown>();

  for (let m of list) {
    for (let [key, resource] of includedFor(m)) {
      included.set(key, resource);
    }
  }

  return {
    ...(included.size ? { included: [...included.values()] } : {}),
    data: list.map(data),
  };
}
