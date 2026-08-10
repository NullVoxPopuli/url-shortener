import Link from '#models/link';
import { jsonapi } from '#jsonapi';
import { render } from '#jsonapi/data';
import { accountContext } from '#services/account_context';
import type { HttpContext } from '@adonisjs/core/http';

export async function listLinks(context: HttpContext) {
  let { auth, request, response } = context;

  let user = await auth.authenticate();
  let account = await accountContext(context, user);

  if (!account) {
    return jsonapi.notFound({ kind: 'Account', id: String(request.input('account')) });
  }

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
