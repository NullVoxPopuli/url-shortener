import Link from '#models/link';
import { render } from '#jsonapi/data';
import { authenticateWithScope } from '#services/api_keys';
import type { HttpContext } from '@adonisjs/core/http';

export async function listLinks(context: HttpContext) {
  let { response } = context;

  let authed = await authenticateWithScope(context, 'links:read');

  if ('response' in authed) return authed.response;

  let { account } = authed;

  let links = await Link.query()
    .where('owned_by', account.id)
    .withScopes((scopes) => {
      scopes.notExpired();
    })
    .preload('ownedBy')
    .preload('createdBy');

  response.status(200);
  return render.links(links);
}
