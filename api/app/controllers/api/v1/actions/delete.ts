import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { jsonapi } from '#jsonapi';

export async function deleteLink(context: HttpContext) {
  let { request, response } = context;
  let id = request.param('id');

  let link = await Link.find(id);

  await link?.delete();

  response.status(200);

  return jsonapi.empty();
}
