import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { jsonapi } from '#jsonapi';
import { isUUID } from '#utils/uuid';
import { authenticateWithScope } from '#services/api_keys';

export async function showLink(context: HttpContext) {
  let { request } = context;
  let id = request.param('id');

  let authed = await authenticateWithScope(context, 'links:read');

  if ('response' in authed) return authed.response;

  let { account } = authed;

  if (!isUUID(id)) {
    return jsonapi.unprocessableContent(`ID received is not a valid UUID`);
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
    return jsonapi.notFound({ id, kind: 'Link' });
  }

  return context.jsonApi.render(link);
}
