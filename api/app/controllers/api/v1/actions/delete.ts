import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { notFound } from '#exceptions/api_errors';
import { authenticateWithScope } from '#services/api_keys';

export async function deleteLink(context: HttpContext) {
  let { request, response } = context;

  let id = request.param('id');

  let { account } = await authenticateWithScope(context, 'links:write');

  /**
   * Scoped to the caller's account: someone else's link 404s exactly
   * like a non-existent id — no leak about which ids exist.
   */
  let link = await Link.query().where('owned_by', account.id).where('id', id).first();

  if (!link) {
    throw notFound('Link', id);
  }

  await link.delete();

  response.status(200);

  // 200 + `data: null`: the client store hydrates every response, so
  // deletes return the spec's empty document rather than a 204.
  return context.jsonApi.render(null);
}
