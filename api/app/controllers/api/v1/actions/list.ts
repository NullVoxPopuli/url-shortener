import Link from '#models/link';
import { authenticateWithScope } from '#services/api_keys';
import type { HttpContext } from '@adonisjs/core/http';

export async function listLinks(context: HttpContext) {
  let { account } = await authenticateWithScope(context, 'links:read');

  // Newest first, one page at a time: ?page[number]= and ?page[size]=
  // (default size from config/jsonapi.ts). The document carries
  // first / prev / next / last links and meta.page.
  let links = await context.jsonApi
    .query(Link)
    .where('owned_by', account.id)
    .withScopes((scopes) => {
      scopes.notExpired();
    })
    .orderBy('created_at', 'desc')
    .paginate(...context.jsonApi.page);

  return context.jsonApi.render(links);
}
