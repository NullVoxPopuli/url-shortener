import { withReactiveResponse } from '@warp-drive/core/request';

import config from '#config';

import type { BillingStatus, CustomDomain, Invitation, Link, Membership } from '#app/data/types';

function jsonapiHeaders() {
  return new Headers({
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  });
}

export function getBillingStatus(accountId?: string) {
  return withReactiveResponse<BillingStatus>({
    url: `${config.apiOrigin}/v1/billing/status${accountId ? `?account=${accountId}` : ''}`,
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
    url: `${config.apiOrigin}/v1/links${accountId ? `?account=${accountId}` : ''}`,
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    cacheOptions: { types: ['link'] },
  });
}

export function deleteLink(id: string, accountId?: string) {
  return withReactiveResponse<null>({
    url: `${config.apiOrigin}/v1/links/${id}${accountId ? `?account=${accountId}` : ''}`,
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
    url: `${config.apiOrigin}/v1/links${accountId ? `?account=${accountId}` : ''}`,
    method: 'POST',
    op: 'createRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
    body: JSON.stringify(domain ? { originalUrl, domain } : { originalUrl }),
  });
}

export function getMemberships(accountId: string) {
  return withReactiveResponse<Membership[]>({
    url: `${config.apiOrigin}/v1/accounts/${accountId}/memberships`,
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    cacheOptions: { types: ['membership'] },
  });
}

export function getInvitations(accountId: string) {
  return withReactiveResponse<Invitation[]>({
    url: `${config.apiOrigin}/v1/accounts/${accountId}/invitations`,
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    cacheOptions: { types: ['invitation'] },
  });
}

export function createInvitation(accountId: string) {
  return withReactiveResponse<Invitation>({
    url: `${config.apiOrigin}/v1/accounts/${accountId}/invitations`,
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
    url: `${config.apiOrigin}/v1/invitations/accept`,
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


export function getDomains(accountId?: string) {
  return withReactiveResponse<CustomDomain[]>({
    url: `${config.apiOrigin}/v1/domains${accountId ? `?account=${accountId}` : ''}`,
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    cacheOptions: { types: ['custom-domain'] },
  });
}

export function createDomain(hostname: string, accountId?: string) {
  return withReactiveResponse<CustomDomain>({
    url: `${config.apiOrigin}/v1/domains${accountId ? `?account=${accountId}` : ''}`,
    method: 'POST',
    op: 'createRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
    body: JSON.stringify({ hostname }),
  });
}

export function deleteDomain(id: string, accountId?: string) {
  return withReactiveResponse<null>({
    url: `${config.apiOrigin}/v1/domains/${id}${accountId ? `?account=${accountId}` : ''}`,
    method: 'DELETE',
    op: 'deleteRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
  });
}
