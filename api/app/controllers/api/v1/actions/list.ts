import Link from '#models/link';
import { render } from '#jsonapi/data';
import type { HttpContext } from '@adonisjs/core/http';

export async function listLinks(context: HttpContext) {
  let { auth, response } = context;

  let user = await auth.authenticate();
  let links = await Link.query().withScopes((scopes) => {
    scopes.visibleTo(user);
    scopes.notExpired();
  });

  response.status(200);
  return render.links(links);
}
