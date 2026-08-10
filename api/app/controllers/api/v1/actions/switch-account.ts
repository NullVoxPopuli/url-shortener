import type { HttpContext } from '@adonisjs/core/http';
import type { Response } from '#jsonapi';
import { jsonapi } from '#jsonapi';
import { render } from '#jsonapi/data';
import Account from '#models/account';
import { membershipFor } from '#services/team';

/**
 * Point the caller's ACTIVE account at another account they belong to.
 */
export async function switchAccount(context: HttpContext): Promise<Response> {
  let { auth, request, response } = context;

  let user = await auth.authenticate();
  let accountId = request.input('accountId');

  let membership = accountId ? await membershipFor(user.id, accountId) : null;

  if (!membership) {
    return jsonapi.notFound({ kind: 'Account', id: String(accountId) });
  }

  user.account_id = membership.account_id;
  await user.save();

  let account = await Account.query()
    .preload('admin')
    .where('id', membership.account_id)
    .firstOrFail();

  response.status(200);

  return render.account(account);
}
