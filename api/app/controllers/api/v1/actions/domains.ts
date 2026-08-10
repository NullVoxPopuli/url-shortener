import type { HttpContext } from '@adonisjs/core/http';
import type { Response } from '#jsonapi';
import CustomDomain from '#models/custom_domain';
import { accountContext } from '#services/account_context';
import { jsonapi } from '#jsonapi';
import { render } from '#jsonapi/data';
import { planFor } from '#services/plans';
import { DOMAIN } from '#start/env';
import { membershipFor } from '#services/team';

/**
 * A bare hostname: labels with letters/digits/hyphens, at least one
 * dot, no scheme, no path, no port.
 */
const HOSTNAME_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

export async function listDomains(context: HttpContext): Promise<Response> {
  let { auth, request, response } = context;

  let user = await auth.use('web').authenticate();
  let contextAccount = await accountContext(context, user);

  if (!contextAccount) {
    return jsonapi.notFound({ kind: 'Account', id: String(request.input('account')) });
  }

  let domains = await CustomDomain.query()
    .where('account_id', contextAccount.id)
    .preload('account', (query) => query.preload('admin'))
    .orderBy('created_at', 'asc');

  response.status(200);

  return render.customDomains(domains);
}

export async function createDomain(context: HttpContext): Promise<Response> {
  let { auth, request, response } = context;

  let user = await auth.use('web').authenticate();
  let account = await accountContext(context, user);

  if (!account) {
    return jsonapi.notFound({ kind: 'Account', id: String(request.input('account')) });
  }

  let membership = await membershipFor(user.id, account.id);

  if (membership?.role !== 'admin') {
    return jsonapi.notAuthorized({ stack: 'Only account admins can manage domains' });
  }

  let plan = planFor(account);

  let hostname = String(request.input('hostname') ?? '')
    .trim()
    .toLowerCase();

  if (!HOSTNAME_PATTERN.test(hostname)) {
    return jsonapi.unprocessableContent(
      `"${hostname}" is not a valid hostname (expected something like links.example.com)`
    );
  }

  if (hostname === DOMAIN || hostname.endsWith(`.${DOMAIN}`)) {
    return jsonapi.unprocessableContent(`${DOMAIN} is the built-in domain — no need to add it`);
  }

  let existing = await CustomDomain.query().where('account_id', account.id);

  if (plan.customDomains !== null && existing.length >= plan.customDomains) {
    return jsonapi.errors((error) => {
      error({
        status: 402,
        title: 'Custom domain limit reached',
        detail:
          plan.customDomains === 0
            ? 'Your plan does not include custom domains. Upgrade to add one.'
            : `Your plan includes ${plan.customDomains} custom domain(s).`,
      });
    });
  }

  let taken = await CustomDomain.findBy({ hostname });

  if (taken) {
    return jsonapi.unprocessableContent(`${hostname} is already in use`);
  }

  let domain = await CustomDomain.create({ account_id: account.id, hostname });

  await domain.load('account', (query) => query.preload('admin'));

  response.status(201);

  return render.customDomain(domain);
}

export async function deleteDomain(context: HttpContext): Promise<Response> {
  let { auth, request, response } = context;

  let user = await auth.use('web').authenticate();
  let id = request.param('id');

  let account = await accountContext(context, user);

  if (!account) {
    return jsonapi.notFound({ kind: 'Account', id: String(request.input('account')) });
  }

  let membership = await membershipFor(user.id, account.id);

  if (membership?.role !== 'admin') {
    return jsonapi.notAuthorized({ stack: 'Only account admins can manage domains' });
  }

  let domain = await CustomDomain.query().where('id', id).where('account_id', account.id).first();

  if (!domain) {
    return jsonapi.notFound({ kind: 'CustomDomain', id });
  }

  await domain.delete();

  response.status(200);

  return jsonapi.empty();
}
