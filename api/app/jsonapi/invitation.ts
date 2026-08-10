import type { DataResponse } from '#jsonapi';
import type AccountInvitation from '#models/account_invitation';
import { API_ORIGIN, APP_ORIGIN } from '#start/env';
import { account } from './account.js';

function includedFor(invitation: AccountInvitation) {
  if (!invitation.account) return [];

  let doc = account(invitation.account);

  return [...(doc.included ?? []), doc.data];
}

/**
 * Only rendered to account admins — the token/acceptUrl are the
 * shareable secret.
 */
function data(invitation: AccountInvitation) {
  return {
    type: 'invitation',
    id: String(invitation.id),
    attributes: {
      role: invitation.role,
      token: invitation.token,
      acceptUrl: `${APP_ORIGIN}/join/${invitation.token}`,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
    },
    relationships: {
      account: {
        data: { type: 'account', id: invitation.account_id },
        links: { related: `${API_ORIGIN}/v1/accounts/${invitation.account_id}` },
      },
    },
  };
}

export function invitation(invitation: AccountInvitation): DataResponse {
  let included = includedFor(invitation);

  return {
    ...(included.length ? { included } : {}),
    data: data(invitation),
  };
}

export function invitations(list: AccountInvitation[]) {
  let included = new Map<string, unknown>();

  for (let i of list) {
    for (let resource of includedFor(i)) {
      let record = resource as { type: string; id: string };

      included.set(`${record.type}:${record.id}`, resource);
    }
  }

  return {
    ...(included.size ? { included: [...included.values()] } : {}),
    data: list.map(data),
  };
}
