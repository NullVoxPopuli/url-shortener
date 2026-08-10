import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { render } from '#jsonapi/data';
import { jsonapi } from '#jsonapi';
import { isUUID } from '#utils/uuid';
import { accountContext } from '#services/account_context';

export async function showLink(context: HttpContext) {
  let { auth, request, response } = context;
  let id = request.param('id');

  if (!isUUID(id)) {
    return jsonapi.unprocessableContent(`ID received is not a valid UUID`);
  }

  let user = await auth.authenticate();
  let account = await accountContext(context, user);

  if (!account) {
    return jsonapi.notFound({ kind: 'Account', id: String(request.input('account')) });
  }

  let link = await Link.query()
    .where('owned_by', account.id)
    .withScopes((scopes) => {
      scopes.notExpired();
    })
    .preload('ownedBy')
    .preload('createdBy')
    .where('id', id)
    .first();

  if (!link) {
    return jsonapi.notFound({ id, kind: 'Link' });
  }

  response.status(200);

  return render.link(link);
}
