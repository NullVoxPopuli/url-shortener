import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { jsonapi } from '#jsonapi';

export async function deleteLink(context: HttpContext) {
  let { auth, request, response } = context;

  let user = await auth.authenticate();
  let id = request.param('id');

  /**
   * Scoped to the caller's account: deleting someone else's link is a
   * silent no-op (200), indistinguishable from deleting a non-existent
   * id — no information leak about which ids exist.
   */
  let link = await Link.query()
    .withScopes((scopes) => scopes.visibleTo(user))
    .where('id', id)
    .first();

  await link?.delete();

  response.status(200);

  return jsonapi.empty();
}
