import type { HttpContext } from '@adonisjs/core/http';
import { jsonapi } from '#jsonapi';
import Link from '#models/link';
import { render } from '#jsonapi/data';
import { glimdownOwner } from '#consts';
import type User from '#models/user';
import { quotaForAccount } from '#services/link_quota';
import { accountContext } from '#services/account_context';
import CustomDomain from '#models/custom_domain';

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

  let account = await accountContext(context, user);
  let quota = account ? await quotaForAccount(account) : null;
  let canCreate = quota && (quota.remaining === null || quota.remaining > 0);
  if (canCreate) {
    let requestedDomain = data.domain ? String(data.domain).trim().toLowerCase() : null;

    if (requestedDomain) {
      let owned = await CustomDomain.query()
        .where('account_id', account!.id)
        .where('hostname', requestedDomain)
        .first();

      if (!owned) {
        return jsonapi.unprocessableContent(
          `${requestedDomain} is not one of your account's custom domains`
        );
      }
    }

    let link = await createMeteredLink(user, account!.id, parsed, requestedDomain);

    response.status(201);
    return render.link(link);
  }

  return jsonapi.errors((error) => {
    error({
      status: 402,
      title: 'Payment required',
      detail:
        quota?.remaining === 0
          ? 'Monthly link limit reached'
          : 'An account is required to create links',
    });
  });
}

async function createUnmeteredLink(url: URL): Promise<Link> {
  let link = new Link();
  link.original = url.toString();
  link.owned_by = glimdownOwner.id;
  link.created_by = glimdownOwner.id;
  await link.save();
  await loadRelations(link);

  return link;
}

async function createMeteredLink(
  user: User,
  accountId: string,
  url: URL,
  domain: string | null = null
): Promise<Link> {
  let link = new Link();
  link.original = url.toString();
  link.domain = domain;
  link.owned_by = accountId;
  link.created_by = user.id;
  await link.save();
  await loadRelations(link);

  return link;
}

/**
 * So the response can sideload (`included`) the related resources.
 * The glimdown pseudo-owner may not have rows; that is fine — the
 * renderer skips relations that are not loaded.
 */
async function loadRelations(link: Link) {
  try {
    await link.load('ownedBy');
    await link.load('createdBy');
  } catch {
    // no rows to load; renderer handles absence
  }
}
