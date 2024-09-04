import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { render } from '#jsonapi/data';
import { jsonapi } from '#jsonapi';

export async function showLink(context: HttpContext) {
  let { auth, request, response } = context;
  let id = request.param('id');

  let user = await auth.authenticate();
  let link = await Link.query()
    .withScopes((scopes) => {
      scopes.visibleTo(user);
      scopes.notExpired();
    })
    .where('id', id)
    .first();

  if (!link) {
    return jsonapi.notFound({ id, kind: 'Link' });
  }

  response.status(200);

  return render.link(link);
}
