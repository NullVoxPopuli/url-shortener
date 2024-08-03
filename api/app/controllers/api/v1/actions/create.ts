import type { HttpContext } from '@adonisjs/core/http';
import { jsonapi } from '#jsonapi';
import db from '@adonisjs/lucid/services/db';
import Link from '#models/link';
import { render } from '#jsonapi/data';
import { glimdownOwner } from '#consts';

export async function createLink(context: HttpContext) {
  let { auth, request, response } = context;
  let user = auth.user;
  let data = request.body();
  let originalUrl = data.originalUrl;

  if (!originalUrl) {
    return jsonapi.errors((error) => {
      error({
        status: 422,
        title: 'Missing URL',
      });
    });
  }

  if (!URL.canParse(originalUrl)) {
    return jsonapi.errors((error) => {
      error({
        status: 422,
        title: 'Cannot parse URL, check the URL',
      });
    });
  }

  let parsed = new URL(originalUrl);
  let isGlimdown = parsed.host === 'glimdown.com';

  if (!isGlimdown) {
    if (!user) {
      return jsonapi.errors((error) => {
        error({
          status: 401,
          title: 'Authentication required',
        });
      });
    }

    return jsonapi.notImplemented();
  }

  let link = await createUnmeteredLink(context, parsed);

  response.status(201);
  return render.link(request, link);
}

async function createUnmeteredLink(context: HttpContext, url: URL): Promise<Link> {
  let link = new Link();
  link.original = url.toString();
  link.owned_by = glimdownOwner.id;
  link.created_by = glimdownOwner.id;
  await link.save();

  return link;
}
