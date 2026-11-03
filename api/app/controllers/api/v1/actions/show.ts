import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { notFound, unprocessable } from '#exceptions/api_errors';
import { isUUID } from '#utils/uuid';
import { authenticateWithScope } from '#services/api_keys';

export async function showLink(context: HttpContext) {
  let { request } = context;
  let id = request.param('id');

  let { account } = await authenticateWithScope(context, 'links:read');

  if (!isUUID(id)) {
    throw unprocessable('ID received is not a valid UUID');
  }

  let link = await context.jsonApi
    .query(Link)
    .where('owned_by', account.id)
    .withScopes((scopes) => {
      scopes.notExpired();
    })
    .where('id', id)
    .first();

  if (!link) {
    throw notFound('Link', id);
  }

  return context.jsonApi.render(link);
}
