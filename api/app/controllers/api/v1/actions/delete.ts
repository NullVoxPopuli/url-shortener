import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { jsonapi } from '#jsonapi';
import { accountContext } from '#services/account_context';

export async function deleteLink(context: HttpContext) {
  let { auth, request, response } = context;

  let user = await auth.authenticate();
  let id = request.param('id');

  let account = await accountContext(context, user);

  if (!account) {
    return jsonapi.notFound({ kind: 'Account', id: String(request.input('account')) });
  }

  /**
   * Scoped to the caller's account: someone else's link 404s exactly
   * like a non-existent id — no leak about which ids exist.
   */
  let link = await Link.query().where('owned_by', account.id).where('id', id).first();

  if (!link) {
    return jsonapi.notFound({ kind: 'Link', id });
  }

  await link.delete();

  response.status(200);

  return jsonapi.empty();
}
