import type { HttpContext } from '@adonisjs/core/http';
import AccountMembership from '#models/account_membership';
import User from '#models/user';
import { jsonapi } from '#jsonapi';

export async function showUser(context: HttpContext) {
  let { auth, request } = context;

  let user = await auth.use('web').authenticate();
  let id = request.param('id');

  let target = await context.jsonApi.query(User).where('id', id).first();

  /**
   * Users are visible when they share at least one account with the
   * caller; anything else is a 404, indistinguishable from a
   * non-existent id.
   */
  let visible = target && (target.id === user.id || (await sharesAnAccount(user.id, target.id)));

  if (!target || !visible) {
    return jsonapi.notFound({ kind: 'User', id });
  }

  return context.jsonApi.render(target);
}

async function sharesAnAccount(a: string, b: string) {
  let mine = await AccountMembership.query().where('user_id', a);
  let accountIds = mine.map((membership) => membership.account_id);

  if (accountIds.length === 0) return false;

  let shared = await AccountMembership.query()
    .where('user_id', b)
    .whereIn('account_id', accountIds)
    .first();

  return Boolean(shared);
}
