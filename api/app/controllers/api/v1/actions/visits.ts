import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import LinkVisit from '#models/link_visit';
import { jsonapi } from '#jsonapi';
import { authenticateWithScope } from '#services/api_keys';

export async function listVisits(context: HttpContext) {
  let { request } = context;

  let id = request.param('id');

  let authed = await authenticateWithScope(context, 'links:read');

  if ('response' in authed) return authed.response;

  let { account } = authed;

  let link = await Link.query().where('owned_by', account.id).where('id', id).first();

  if (!link) {
    return jsonapi.notFound({ kind: 'Link', id });
  }

  let visits = await context.jsonApi
    .query(LinkVisit)
    .where('link_id', link.id)
    .orderBy('visited_at', 'desc')
    .limit(1000);

  return context.jsonApi.render(visits);
}
