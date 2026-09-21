import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { glimdownOwner } from '#consts';
import type User from '#models/user';
import { notAuthenticated, paymentRequired, unprocessable } from '#exceptions/api_errors';
import { quotaForAccount } from '#services/link_quota';
import { maybeAuthenticateWithScope } from '#services/api_keys';
import CustomDomain from '#models/custom_domain';

/**
 * The { json:api } entry point: unpacks the resource document, then
 * defers to the shared creation flow (the SSR home form calls
 * createLinkFromValues directly with its flat form body).
 */
export async function createLink(context: HttpContext) {
  let input = await context.jsonApi.deserialize(Link);

  return createLinkFromValues(context, {
    original: input.attributes.original ? String(input.attributes.original) : '',
    domain: input.attributes.domain ? String(input.attributes.domain) : null,
  });
}

export async function createLinkFromValues(
  context: HttpContext,
  values: { original: string; domain?: string | null }
) {
  let { response } = context;
  let originalUrl = values.original;

  if (!originalUrl) {
    throw unprocessable('Missing URL');
  }

  if (!URL.canParse(originalUrl)) {
    throw unprocessable('Cannot parse URL, check the URL');
  }

  let parsed = new URL(originalUrl);
  let isGlimdown = parsed.host.endsWith('glimdown.com') || parsed.host.endsWith('repl.nvp.gg');

  let authed = await maybeAuthenticateWithScope(context, 'links:write');

  if (!authed) {
    /**
     * While glimdown has special treatment,
     * we don't want to hijack paid accounts
     * from creating glimdown short-urls.
     */
    if (isGlimdown) {
      let link = await createUnmeteredLink(parsed);

      response.status(201);
      return renderFresh(context, link);
    }

    throw notAuthenticated('You are not logged in and / or did not provide an API key.');
  }

  let { user, account } = authed;
  let quota = await quotaForAccount(account);
  let canCreate = quota.remaining === null || quota.remaining > 0;
  if (canCreate) {
    let requestedDomain = values.domain ? String(values.domain).trim().toLowerCase() : null;

    if (requestedDomain) {
      let owned = await CustomDomain.query()
        .where('account_id', account.id)
        .where('hostname', requestedDomain)
        .first();

      if (!owned) {
        throw unprocessable(`${requestedDomain} is not one of your account's custom domains`);
      }
    }

    let link = await createMeteredLink(user, account.id, parsed, requestedDomain);

    response.status(201);
    return renderFresh(context, link);
  }

  throw paymentRequired('Payment required', 'Monthly link limit reached');
}

async function createUnmeteredLink(url: URL): Promise<Link> {
  let link = new Link();
  link.original = url.toString();
  link.owned_by = glimdownOwner.id;
  link.created_by = glimdownOwner.id;
  await link.save();

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

  return link;
}

/**
 * Re-fetch through the include-aware query so the response honours
 * ?include= paths. The glimdown pseudo-owner may not have rows to
 * preload; the builder skips relations that are not loaded.
 */
async function renderFresh(context: HttpContext, link: Link) {
  let fresh = await context.jsonApi.query(Link).where('id', link.id).first();

  return context.jsonApi.render(fresh ?? link);
}
