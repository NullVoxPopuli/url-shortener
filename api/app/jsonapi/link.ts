import { DataResponse } from '#jsonapi';
import Link from '#models/link';
import { DOMAIN } from '#start/env';

export function link(link: Link): DataResponse {
  let shortUrl = `https://${DOMAIN}/${link.encodedId}`;

  return {
    data: {
      id: link.id,
      attributes: {
        shortUrl,
        visits: link.visits,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        expiresAt: link.expiresAt,
      },
      relationships: {
        ownedBy: { type: 'account', id: link.owned_by },
        createdBy: { type: 'user', id: link.created_by },
      },
    },
  };
}

export function links(links: Link[]) {
  return {
    included: [],
    links: [],
    data: links.map(link).map((x) => x.data),
  };
}
