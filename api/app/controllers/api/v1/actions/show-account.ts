import type { HttpContext } from '@adonisjs/core/http';
import Account from '#models/account';
import { jsonapi } from '#jsonapi';
import { membershipFor } from '#services/team';

export async function showAccount(context: HttpContext) {
  let { auth, request } = context;

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

  let account = await context.jsonApi.query(Account).where('id', id).first();

  if (!account) {
    return jsonapi.notFound({ kind: 'Account', id });
  }

  return context.jsonApi.render(account);
}
