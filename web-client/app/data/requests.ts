import { withReactiveResponse } from '@warp-drive/core/request';

import config from '#config';

import type { BillingStatus, Link } from '#app/data/types';

function jsonapiHeaders() {
  return new Headers({
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  });
}

export function getBillingStatus() {
  return withReactiveResponse<BillingStatus>({
    url: `${config.apiOrigin}/v1/billing/status`,
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    // 'link' is included so link mutations invalidate the cached
    // usage numbers, which are derived from links.
    cacheOptions: { types: ['billing-status', 'link'] },
  });
}

export function getLinks() {
  return withReactiveResponse<Link[]>({
    url: `${config.apiOrigin}/v1/links`,
    method: 'GET',
    op: 'query',
    credentials: 'include',
    headers: jsonapiHeaders(),
    cacheOptions: { types: ['link'] },
  });
}

export function deleteLink(id: string) {
  return withReactiveResponse<null>({
    url: `${config.apiOrigin}/v1/links/${id}`,
    method: 'DELETE',
    op: 'deleteRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
  });
}

export function createLink(originalUrl: string) {
  return withReactiveResponse<Link>({
    url: `${config.apiOrigin}/v1/links`,
    method: 'POST',
    op: 'createRecord',
    credentials: 'include',
    headers: jsonapiHeaders(),
    body: JSON.stringify({ originalUrl }),
  });
}
