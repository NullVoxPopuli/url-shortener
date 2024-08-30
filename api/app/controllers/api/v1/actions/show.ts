import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { render } from '#jsonapi/data';
import { jsonapi } from '#jsonapi';

export async function showLink(context: HttpContext) {
  let { request, response } = context;
  let id = request.param('id');

  let link = await Link.find(id);

  if (!link) {
    return jsonapi.notFound({ id, kind: 'Link' });
  }

  response.status(200);

  return render.link(link);
}
