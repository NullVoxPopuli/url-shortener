import Link from '#models/link';
import { authenticateWithScope } from '#services/api_keys';
import type { HttpContext } from '@adonisjs/core/http';

export async function listLinks(context: HttpContext) {
  let { account } = await authenticateWithScope(context, 'links:read');

  let links = await context.jsonApi
    .query(Link)
    .where('owned_by', account.id)
    .withScopes((scopes) => {
      scopes.notExpired();
    });

  return context.jsonApi.render(links);
}
