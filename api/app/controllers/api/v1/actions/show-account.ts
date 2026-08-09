import type { HttpContext } from '@adonisjs/core/http';
import Account from '#models/account';
import { jsonapi } from '#jsonapi';
import { render } from '#jsonapi/data';

export async function showAccount(context: HttpContext) {
  let { auth, request, response } = context;

  let user = await auth.authenticate();
  let id = request.param('id');

  /**
   * Only the caller's own account is visible; anything else is a 404
   * (indistinguishable from a non-existent id).
   */
  if (id !== user.account_id) {
    return jsonapi.notFound({ kind: 'Account', id });
  }

  let account = await Account.query().preload('admin').where('id', id).first();

  if (!account) {
    return jsonapi.notFound({ kind: 'Account', id });
  }

  response.status(200);

  return render.account(account);
}
