import type { HttpContext } from '@adonisjs/core/http';
import { jsonapi } from '#jsonapi';
import Link from '#models/link';
import { render } from '#jsonapi/data';
import { glimdownOwner } from '#consts';
import User from '#models/user';
import Account from '#models/account';

export async function createLink(context: HttpContext) {
  let { request, response } = context;
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
  let isGlimdown = parsed.host.endsWith('glimdown.com') || parsed.host.endsWith('repl.nvp.gg');

  await context.auth.check();
  let user = context.auth.user;

  if (!user) {
    /**
     * While glimdown has special treatment,
     * we don't want to hijack paid accounts
     * from creating glimdown short-urls.
     */
    if (isGlimdown) {
      let link = await createUnmeteredLink(parsed);

      response.status(201);
      return render.link(link);
    }

    return jsonapi.errors((error) => {
      error({
        status: 401,
        title: 'Authentication required',
        detail: 'You are not logged in and / or did not provide an API key.',
      });
    });
  }

  let account = await Account.find(user.account_id);
  let canCreate = account?.isFree || account?.hasActiveSubscription;
  if (canCreate) {
    let link = await createMeteredLink(user, parsed);

    response.status(201);
    return render.link(link);
  }

  return jsonapi.errors((error) => {
    error({
      status: 402,
      title: 'Payment required',
      detail: 'A subscription is required to create links',
    });
  });
}

async function createUnmeteredLink(url: URL): Promise<Link> {
  let link = new Link();
  link.original = url.toString();
  link.owned_by = glimdownOwner.id;
  link.created_by = glimdownOwner.id;
  await link.save();

  return link;
}

async function createMeteredLink(user: User, url: URL): Promise<Link> {
  let link = new Link();
  link.original = url.toString();
  link.owned_by = user.account_id;
  link.created_by = user.id;
  await link.save();

  return link;
}
