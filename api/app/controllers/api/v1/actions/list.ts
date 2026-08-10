import Link from '#models/link';
import { authenticateWithScope } from '#services/api_keys';
import type { HttpContext } from '@adonisjs/core/http';

export async function listLinks(context: HttpContext) {
  let authed = await authenticateWithScope(context, 'links:read');

  if ('response' in authed) return authed.response;

  let { account } = authed;

  let links = await context.jsonApi
    .query(Link)
    .where('owned_by', account.id)
    .withScopes((scopes) => {
      scopes.notExpired();
    });

  return context.jsonApi.render(links);
}
