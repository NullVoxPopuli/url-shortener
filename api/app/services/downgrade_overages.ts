import { DateTime } from 'luxon';
import type Account from '#models/account';
import CustomDomain from '#models/custom_domain';
import Link from '#models/link';
import { apiKeyCapacity } from './api_keys.js';
import { editQuotaForAccount, quotaForAccount } from './link_quota.js';
import { teamCapacity } from './team.js';

export type OverageResource =
  | 'links'
  | 'linkEdits'
  | 'expiringLinks'
  | 'customDomains'
  | 'apiKeys'
  | 'teammates';

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
  linkEditsPerMonth: number | null;
  linkExpiration: boolean;
  customDomains: number | null;
  apiKeys: number | null;
  teammates: number | null;
}

/**
 * Links made this UTC month that carry an expiration. A plan without
 * link expiration allows none.
 */
async function expiringLinksThisMonth(account: Account) {
  const periodStart = DateTime.utc().startOf('month');
  const [row] = await Link.query()
    .where('owned_by', account.id)
    .where('created_at', '>=', periodStart.toSQL()!)
    .whereNotNull('expires_at')
    .count('* as total');

  return Number(row?.$extras.total ?? 0);
}

export async function overagesFor(account: Account, plan: PlanLimits): Promise<Overage[]> {
  const [links, edits, expiring, keys, team, domains] = await Promise.all([
    quotaForAccount(account),
    editQuotaForAccount(account),
    expiringLinksThisMonth(account),
    apiKeyCapacity(account),
    teamCapacity(account),
    CustomDomain.query().where('account_id', account.id).count('* as total'),
  ]);
  const domainCount = Number(domains[0]?.$extras.total ?? 0);

  const candidates: Array<{ resource: OverageResource; used: number; limit: number | null }> = [
    { resource: 'links', used: links.used, limit: plan.monthlyLinkLimit },
    { resource: 'linkEdits', used: edits.used, limit: plan.linkEditsPerMonth },
    { resource: 'expiringLinks', used: expiring, limit: plan.linkExpiration ? null : 0 },
    { resource: 'customDomains', used: domainCount, limit: plan.customDomains },
    { resource: 'apiKeys', used: keys.used, limit: plan.apiKeys },
    { resource: 'teammates', used: team.teammates, limit: plan.teammates },
  ];

  return candidates.filter(
    (candidate): candidate is Overage =>
      candidate.limit !== null && candidate.used > candidate.limit
  );
}
