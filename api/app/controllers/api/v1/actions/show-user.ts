import type { HttpContext } from '@adonisjs/core/http';
import User from '#models/user';
import { jsonapi } from '#jsonapi';
import { render } from '#jsonapi/data';

export async function showUser(context: HttpContext) {
  let { auth, request, response } = context;

  let user = await auth.authenticate();
  let id = request.param('id');

  let target = await User.query().preload('account').where('id', id).first();

  /**
   * Users are visible within their own account only (self today,
   * teammates later); anything else is a 404, indistinguishable from
   * a non-existent id.
   */
  if (!target || target.account_id !== user.account_id) {
    return jsonapi.notFound({ kind: 'User', id });
  }

  response.status(200);

  return render.user(target);
}
