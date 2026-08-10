import type { DataResponse } from '#jsonapi';
import type CustomDomain from '#models/custom_domain';
import { API_ORIGIN } from '#start/env';
import { account } from './account.js';

function includedFor(domain: CustomDomain) {
  if (!domain.account) return [];

  let doc = account(domain.account);

  return [...(doc.included ?? []), doc.data];
}

function data(domain: CustomDomain) {
  return {
    type: 'custom-domain',
    id: String(domain.id),
    attributes: {
      hostname: domain.hostname,
      createdAt: domain.createdAt,
    },
    relationships: {
      account: {
        data: { type: 'account', id: domain.account_id },
        links: { related: `${API_ORIGIN}/v1/accounts/${domain.account_id}` },
      },
    },
  };
}

export function customDomain(domain: CustomDomain): DataResponse {
  let included = includedFor(domain);

  return {
    ...(included.length ? { included } : {}),
    data: data(domain),
  };
}

export function customDomains(list: CustomDomain[]) {
  let included = new Map<string, unknown>();

  for (let d of list) {
    for (let resource of includedFor(d)) {
      let record = resource as { type: string; id: string };

      included.set(`${record.type}:${record.id}`, resource);
    }
  }

  return {
    ...(included.size ? { included: [...included.values()] } : {}),
    data: list.map(data),
  };
}
