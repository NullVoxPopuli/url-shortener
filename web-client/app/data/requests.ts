import { cacheKeyFor } from '@warp-drive/core';
import { withReactiveResponse } from '@warp-drive/core/request';
import {
  createRecord,
  deleteRecord,
  postQuery,
  query,
  serializePatch,
  serializeResources,
  updateRecord,
} from '@warp-drive/utilities/json-api';

import type { Store } from '@warp-drive/core';
import type { RequestInfo } from '@warp-drive/core/types/request';
import type {
  ApiKey,
  BillingStatus,
  CustomDomain,
  Invitation,
  Link,
  Membership,
  PlanResource,
} from '#app/data/types';

/**
 * The api scopes a request to an account with `?accountId=`; without
 * it, the caller's personal account. The builders leave it out of
 * mutation URLs, so it is appended here.
 */
interface Init {
  url: string;
  headers?: Headers;
  body?: unknown;
  cacheOptions?: object;
}

function scoped<T extends Init>(init: T, accountId?: string): T {
  if (!accountId) return init;

  const url = new URL(init.url);

  url.searchParams.set('accountId', accountId);
  init.url = url.toString();

  return init;
}

/**
 * Query params with undefined values left out; the builder would
 * serialize them as the string "undefined".
 */
function params(source: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value)) as Record<
    string,
    string
  >;
}

/**
 * The types a query answers for. A mutation that touches one of them
 * invalidates the query, and `<Request @autorefresh="invalid">`
 * reloads it.
 */
function answersFor<T extends Init>(init: T, types: string[]): T {
  init.cacheOptions = { ...init.cacheOptions, types };

  return init;
}

function jsonBody<T extends Init>(init: T, body: unknown): T {
  init.headers ??= new Headers();
  init.headers.set('Content-Type', 'application/vnd.api+json');
  init.body = JSON.stringify(body);

  return init;
}

/**
 * The mutation builders return their own option types, which
 * `withReactiveResponse` does not accept; at runtime they are request
 * options.
 */
function asRequest(init: Init): RequestInfo {
  return init as unknown as RequestInfo;
}

/**
 * The JSON:API document for a record that has no server id yet. The api
 * refuses client ids, so the local `id` and `lid` stay out of the body.
 */
function newResourceBody(store: Store, record: object) {
  const { data } = serializeResources(store.cache, cacheKeyFor(record));
  const resource: Record<string, unknown> = { ...data };

  delete resource.id;
  delete resource.lid;

  return { data: resource };
}

// Billing and plans

export function getBillingStatus(accountId?: string) {
  return withReactiveResponse<BillingStatus>(
    answersFor(
      query('billing-status', params({ accountId }), { resourcePath: 'billing/status' }),
      // 'link' too: link mutations change the usage numbers
      ['billing-status', 'link']
    )
  );
}

/**
 * Public: no session needed, so the pricing page works before sign-in.
 */
export function getPlans() {
  return answersFor(query<PlanResource>('plan'), ['plan']);
}

// Links

/**
 * One page of links, newest first. The document carries the
 * first / prev / next / last links that <Paginate> follows.
 */
export function getLinks(accountId?: string, page?: { number?: number; size?: number }) {
  return answersFor(
    query<Link>(
      'link',
      params({
        accountId,
        include: 'ownedBy,createdBy',
        'page[number]': page?.number ? String(page.number) : undefined,
        'page[size]': page?.size ? String(page.size) : undefined,
      })
    ),
    ['link']
  );
}

export function createLink(
  store: Store,
  values: { original: string; domain?: string | null },
  accountId?: string
) {
  const link = store.createRecord<Link>('link', {
    original: values.original,
    domain: values.domain ?? null,
  });
  const init = scoped(createRecord(link), accountId);

  init.url += `${init.url.includes('?') ? '&' : '?'}include=ownedBy,createdBy`;

  return withReactiveResponse<Link>(asRequest(jsonBody(init, newResourceBody(store, link))));
}

/**
 * `editable` is a checked-out copy; the body carries the fields the
 * cache tracked as changed on it.
 */
export function updateLink(store: Store, editable: Link, accountId?: string) {
  // the api routes PATCH; the builder sends PUT unless told otherwise
  const init = scoped(updateRecord(editable, { patch: true }), accountId);

  init.url += `${init.url.includes('?') ? '&' : '?'}include=ownedBy,createdBy`;

  return withReactiveResponse<Link>(
    asRequest(jsonBody(init, serializePatch(store.cache, cacheKeyFor(editable))))
  );
}

export function deleteLink(link: Link, accountId?: string) {
  return scoped(deleteRecord(link), accountId);
}

// Team

export function getMemberships(accountId: string) {
  return answersFor(
    query<Membership>(
      'membership',
      { include: 'user,account.admin' },
      { resourcePath: `accounts/${accountId}/memberships` }
    ),
    ['membership']
  );
}

export function getInvitations(accountId: string) {
  return answersFor(
    query<Invitation>(
      'invitation',
      { include: 'account.admin' },
      { resourcePath: `accounts/${accountId}/invitations` }
    ),
    ['invitation']
  );
}

/**
 * The api mints the invitation; the request carries no body.
 */
export function createInvitation(store: Store, accountId: string) {
  const invitation = store.createRecord<Invitation>('invitation', {});
  const init = createRecord(invitation, { resourcePath: `accounts/${accountId}/invitations` });

  init.url += '?include=account.admin';

  return init;
}

export function revokeInvitation(invitation: Invitation) {
  return deleteRecord(invitation);
}

/**
 * Accepting is a POST that answers with the new membership, so it is a
 * query that writes, not a record create.
 */
export function acceptInvitation(token: string) {
  const init = postQuery<Membership>('membership', { token }, { resourcePath: 'invitations/accept' });

  init.url += '?include=user,account.admin';
  init.headers.set('Content-Type', 'application/vnd.api+json');

  return withReactiveResponse<Membership>(answersFor(init, ['membership']));
}

export function removeMembership(membership: Membership) {
  return deleteRecord(membership);
}

// API keys

export function getApiKeys(accountId?: string) {
  return answersFor(query<ApiKey>('api-key', params({ accountId })), ['api-key']);
}

/**
 * The api takes a plain object here, not a JSON:API document. The
 * secret comes back once, on this response's record.
 */
export function createApiKey(
  store: Store,
  values: { name: string; scopes: string[]; expiresInDays?: number | null },
  accountId?: string
) {
  const key = store.createRecord<ApiKey>('api-key', { name: values.name, scopes: values.scopes });

  return withReactiveResponse<ApiKey>(
    asRequest(jsonBody(scoped(createRecord(key), accountId), values))
  );
}

export function revokeApiKey(key: ApiKey, accountId?: string) {
  return scoped(deleteRecord(key), accountId);
}

// Custom domains

export function getDomains(accountId?: string) {
  return answersFor(
    query<CustomDomain>('custom-domain', params({ accountId, include: 'account.admin' }), {
      resourcePath: 'domains',
    }),
    ['custom-domain']
  );
}

export function createDomain(store: Store, hostname: string, accountId?: string) {
  const domain = store.createRecord<CustomDomain>('custom-domain', { hostname });
  const init = scoped(createRecord(domain, { resourcePath: 'domains' }), accountId);

  init.url += `${init.url.includes('?') ? '&' : '?'}include=account.admin`;

  return withReactiveResponse<CustomDomain>(
    asRequest(jsonBody(init, newResourceBody(store, domain)))
  );
}

export function deleteDomain(domain: CustomDomain, accountId?: string) {
  return scoped(deleteRecord(domain, { resourcePath: 'domains' }), accountId);
}
