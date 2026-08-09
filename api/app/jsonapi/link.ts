import type { DataResponse } from '#jsonapi';
import type Link from '#models/link';
import { API_ORIGIN, DOMAIN } from '#start/env';
import { account } from './account.js';
import { user } from './user.js';

/**
 * Sideloaded resources for the link's relationships. Modern clients
 * (linksMode) require full linkage: relationship data must come with
 * the related resources `included`. Callers preload ownedBy/createdBy.
 */
function includedFor(link: Link) {
  let included = [];

  if (link.ownedBy) included.push(account(link.ownedBy).data);
  if (link.createdBy) included.push(user(link.createdBy).data);

  return included;
}

export function link(link: Link): DataResponse {
  let shortUrl = `https://${DOMAIN}/${link.encodedId}`;
  let included = includedFor(link);

  return {
    ...(included.length ? { included } : {}),
    data: {
      type: 'link',
      id: link.id,
      attributes: {
        shortUrl,
        original: link.original,
        visits: link.visits,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        expiresAt: link.expiresAt,
      },
      relationships: {
        ownedBy: {
          data: { type: 'account', id: link.owned_by },
          links: { related: `${API_ORIGIN}/v1/accounts/${link.owned_by}` },
        },
        createdBy: {
          data: { type: 'user', id: link.created_by },
          links: { related: `${API_ORIGIN}/v1/users/${link.created_by}` },
        },
      },
    },
  };
}

export function links(links: Link[]) {
  let included = new Map<string, unknown>();

  for (let l of links) {
    for (let resource of includedFor(l)) {
      let record = resource as { type: string; id: string };

      included.set(`${record.type}:${record.id}`, resource);
    }
  }

  return {
    ...(included.size ? { included: [...included.values()] } : {}),
    data: links.map(link).map((x) => x.data),
  };
}
