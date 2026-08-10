import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import LinkVisit from '#models/link_visit';
import { notFound } from '#exceptions/api_errors';
import { authenticateWithScope } from '#services/api_keys';

export async function listVisits(context: HttpContext) {
  let { request } = context;

  let id = request.param('id');

  let { account } = await authenticateWithScope(context, 'links:read');

  let link = await Link.query().where('owned_by', account.id).where('id', id).first();

  if (!link) {
    throw notFound('Link', id);
  }

  let visits = await context.jsonApi
    .query(LinkVisit)
    .where('link_id', link.id)
    .orderBy('visited_at', 'desc')
    .limit(1000);

  return context.jsonApi.render(visits);
}
