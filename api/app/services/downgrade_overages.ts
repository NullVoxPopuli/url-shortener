import type Account from '#models/account';
import CustomDomain from '#models/custom_domain';
import { apiKeyCapacity } from './api_keys.js';
import { quotaForAccount } from './link_quota.js';
import { teamCapacity } from './team.js';

export type OverageResource = 'links' | 'customDomains' | 'apiKeys' | 'teammates';

export interface Overage {
  resource: OverageResource;
  used: number;
  limit: number;
}

/**
 * What the account uses today that the given plan does not allow. Shown
 * as a warning ahead of a downgrade; nothing is removed.
 */
export interface PlanLimits {
  monthlyLinkLimit: number | null;
  customDomains: number | null;
  apiKeys: number | null;
  teammates: number | null;
}

export async function overagesFor(account: Account, plan: PlanLimits): Promise<Overage[]> {
  const [links, keys, team, domains] = await Promise.all([
    quotaForAccount(account),
    apiKeyCapacity(account),
    teamCapacity(account),
    CustomDomain.query().where('account_id', account.id).count('* as total'),
  ]);
  const domainCount = Number(domains[0]?.$extras.total ?? 0);

  const candidates: Array<{ resource: OverageResource; used: number; limit: number | null }> = [
    { resource: 'links', used: links.used, limit: plan.monthlyLinkLimit },
    { resource: 'customDomains', used: domainCount, limit: plan.customDomains },
    { resource: 'apiKeys', used: keys.used, limit: plan.apiKeys },
    { resource: 'teammates', used: team.teammates, limit: plan.teammates },
  ];

  return candidates.filter(
    (candidate): candidate is Overage =>
      candidate.limit !== null && candidate.used > candidate.limit
  );
}
