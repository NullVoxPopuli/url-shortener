import { withReactiveResponse } from '@warp-drive/core/request';

import config from '#config';

import type {
  ApiKey,
  BillingStatus,
  CustomDomain,
  Invitation,
  Link,
  Membership,
} from '#app/data/types';

function url(path: string, params: Record<string, string | undefined>) {
  const qs = Object.entries(params)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `${config.apiOrigin}${path}${qs ? `?${qs}` : ''}`;
}

function jsonapiHeaders() {
  return new Headers({
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  });
}

export function getBillingStatus(accountId?: string) {
  return withReactiveResponse<BillingStatus>({
    url: url('/v1/billing/status', { accountId }),
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    // 'link' is included so link mutations invalidate the cached
    // usage numbers, which are derived from links.
    cacheOptions: { types: ['billing-status', 'link'] },
  });
}

export function getLinks(accountId?: string) {
  return withReactiveResponse<Link[]>({
    url: url('/v1/links', { accountId, include: 'ownedBy,createdBy' }),
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    cacheOptions: { types: ['link'] },
  });
}

export function deleteLink(id: string, accountId?: string) {
  return withReactiveResponse<null>({
    url: url(`/v1/links/${id}`, { accountId }),
    method: 'DELETE',
    op: 'deleteRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
  });
}

export function createLink(
  originalUrl: string,
  domain?: string | null,
  accountId?: string
) {
  return withReactiveResponse<Link>({
    url: url('/v1/links', { accountId, include: 'ownedBy,createdBy' }),
    method: 'POST',
    op: 'createRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
    body: JSON.stringify({
      data: {
        type: 'link',
        attributes: domain ? { original: originalUrl, domain } : { original: originalUrl },
      },
    }),
  });
}

export function getMemberships(accountId: string) {
  return withReactiveResponse<Membership[]>({
    url: url(`/v1/accounts/${accountId}/memberships`, { include: 'user,account.admin' }),
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    cacheOptions: { types: ['membership'] },
  });
}

export function getInvitations(accountId: string) {
  return withReactiveResponse<Invitation[]>({
    url: url(`/v1/accounts/${accountId}/invitations`, { include: 'account.admin' }),
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    cacheOptions: { types: ['invitation'] },
  });
}

export function createInvitation(accountId: string) {
  return withReactiveResponse<Invitation>({
    url: url(`/v1/accounts/${accountId}/invitations`, { include: 'account.admin' }),
    method: 'POST',
    op: 'createRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
  });
}

export function revokeInvitation(id: string) {
  return withReactiveResponse<null>({
    url: `${config.apiOrigin}/v1/invitations/${id}`,
    method: 'DELETE',
    op: 'deleteRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
  });
}

export function acceptInvitation(token: string) {
  return withReactiveResponse<Membership>({
    url: url('/v1/invitations/accept', { include: 'user,account.admin' }),
    method: 'POST',
    op: 'createRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
    body: JSON.stringify({ token }),
  });
}

export function removeMembership(id: string) {
  return withReactiveResponse<null>({
    url: `${config.apiOrigin}/v1/memberships/${id}`,
    method: 'DELETE',
    op: 'deleteRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
  });
}


export function getApiKeys(accountId?: string) {
  return withReactiveResponse<ApiKey[]>({
    url: url('/v1/api-keys', { accountId }),
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    cacheOptions: { types: ['api-key'] },
  });
}

export function createApiKey(
  params: { name: string; scopes: string[]; expiresInDays?: number | null },
  accountId?: string
) {
  return withReactiveResponse<ApiKey>({
    url: url('/v1/api-keys', { accountId }),
    method: 'POST',
    op: 'createRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
    body: JSON.stringify(params),
  });
}

export function revokeApiKey(id: string, accountId?: string) {
  return withReactiveResponse<null>({
    url: url(`/v1/api-keys/${id}`, { accountId }),
    method: 'DELETE',
    op: 'deleteRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
  });
}

export function getDomains(accountId?: string) {
  return withReactiveResponse<CustomDomain[]>({
    url: url('/v1/domains', { accountId, include: 'account.admin' }),
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    cacheOptions: { types: ['custom-domain'] },
  });
}

export function createDomain(hostname: string, accountId?: string) {
  return withReactiveResponse<CustomDomain>({
    url: url('/v1/domains', { accountId, include: 'account.admin' }),
    method: 'POST',
    op: 'createRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
    body: JSON.stringify({ data: { type: 'custom-domain', attributes: { hostname } } }),
  });
}

export function deleteDomain(id: string, accountId?: string) {
  return withReactiveResponse<null>({
    url: url(`/v1/domains/${id}`, { accountId }),
    method: 'DELETE',
    op: 'deleteRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
  });
}
