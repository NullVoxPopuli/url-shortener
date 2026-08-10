import type { HttpContext } from '@adonisjs/core/http';
import Account from '#models/account';
import { jsonapi } from '#jsonapi';
import { render } from '#jsonapi/data';
import { membershipFor } from '#services/team';

export async function showAccount(context: HttpContext) {
  let { auth, request, response } = context;

  let user = await auth.use('web').authenticate();
  let id = request.param('id');

  /**
   * Accounts are visible to their members; anything else is a 404
   * (indistinguishable from a non-existent id).
   */
  let membership = await membershipFor(user.id, id);

  if (!membership) {
    return jsonapi.notFound({ kind: 'Account', id });
  }

  let account = await Account.query().preload('admin').where('id', id).first();

  if (!account) {
    return jsonapi.notFound({ kind: 'Account', id });
  }

  response.status(200);

  return render.account(account);
}
