import type { DataResponse } from '#jsonapi';
import type Link from '#models/link';
import { DOMAIN } from '#start/env';

export function link(link: Link): DataResponse {
  let shortUrl = `https://${DOMAIN}/${link.encodedId}`;

  /**
   * No `relationships`: account/user have no public endpoints, so the
   * linkage is not actionable for API consumers — and every link you
   * can list is yours anyway. (If exposed later, relationships need
   * `links.related` for modern clients, not just identifiers.)
   */
  return {
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
    },
  };
}

export function links(links: Link[]) {
  return {
    data: links.map(link).map((x) => x.data),
  };
}
