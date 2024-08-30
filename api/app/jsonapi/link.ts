import { DataResponse } from '#jsonapi';
import Link from '#models/link';
import { compressedUUID } from '@nullvoxpopuli/url-compression';
import type { Request } from '@adonisjs/core/http';
import { HOST } from '#start/env';

export function link(_request: Request, link: Link): DataResponse {
  let shorter = compressedUUID.encode(link.id);
  let shortUrl = `https://${HOST}/${shorter}`;

  return {
    data: {
      id: link.id,
      attributes: {
        shortUrl,
        visits: link.visits,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
      },
      relationships: {
        ownedBy: { type: 'account', id: link.owned_by },
        createdBy: { type: 'user', id: link.created_by },
      },
    },
  };
}
