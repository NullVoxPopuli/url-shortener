import { DataResponse } from '#jsonapi';
import Link from '#models/link';
import { compressedUUID } from '@nullvoxpopuli/url-compression';
import { DOMAIN } from '#start/env';

export function link(link: Link): DataResponse {
  let shorter = compressedUUID.encode(link.id);
  let shortUrl = `https://${DOMAIN}/${shorter}`;

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
