import type { DataResponse } from '#jsonapi';
import type LinkVisit from '#models/link_visit';
import { API_ORIGIN } from '#start/env';

export function visit(visit: LinkVisit): DataResponse {
  return {
    data: {
      type: 'visit',
      id: String(visit.id),
      attributes: {
        visitedAt: visit.visitedAt,
        referrer: visit.referrer,
        userAgent: visit.userAgent,
      },
      relationships: {
        link: {
          data: { type: 'link', id: visit.link_id },
          links: { related: `${API_ORIGIN}/v1/links/${visit.link_id}` },
        },
      },
    },
  };
}

export function visits(visits: LinkVisit[]) {
  return {
    data: visits.map(visit).map((x) => x.data),
  };
}
