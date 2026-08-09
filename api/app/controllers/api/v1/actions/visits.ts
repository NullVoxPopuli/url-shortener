import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import LinkVisit from '#models/link_visit';
import { jsonapi } from '#jsonapi';
import { render } from '#jsonapi/data';

export async function listVisits(context: HttpContext) {
  let { auth, request, response } = context;

  let user = await auth.authenticate();
  let id = request.param('id');

  let link = await Link.query()
    .withScopes((scopes) => scopes.visibleTo(user))
    .where('id', id)
    .first();

  if (!link) {
    return jsonapi.notFound({ kind: 'Link', id });
  }

  let visits = await LinkVisit.query()
    .where('link_id', link.id)
    .orderBy('visited_at', 'desc')
    .limit(1000);

  response.status(200);

  return render.visits(visits);
}
