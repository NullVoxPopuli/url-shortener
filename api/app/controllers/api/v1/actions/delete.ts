import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { jsonapi } from '#jsonapi';
import { authenticateWithScope } from '#services/api_keys';

export async function deleteLink(context: HttpContext) {
  let { request, response } = context;

  let id = request.param('id');

  let authed = await authenticateWithScope(context, 'links:write');

  if ('response' in authed) return authed.response;

  let { account } = authed;

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
