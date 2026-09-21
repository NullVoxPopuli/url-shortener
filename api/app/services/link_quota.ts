import { DateTime } from 'luxon';

import type Account from '#models/account';
import Link from '#models/link';
import LinkEdit from '#models/link_edit';
import { planFor } from './plans.js';

export async function quotaForAccount(account: Account) {
  const plan = planFor(account);
  const periodStart = DateTime.utc().startOf('month');
  const [row] = await Link.query()
    .where('owned_by', account.id)
    .where('created_at', '>=', periodStart.toSQL()!)
    .count('* as total');
  const used = Number(row?.$extras.total ?? 0);

  return {
    plan,
    used,
    remaining: plan.monthlyLinkLimit === null ? null : Math.max(plan.monthlyLinkLimit - used, 0),
    periodStart: periodStart.toISO(),
    periodEnd: periodStart.endOf('month').toISO(),
  };
}

/**
 * Link edits (destination or expiration changes) this UTC month.
 * `limit` null means unlimited, 0 means the plan has no editing.
 */
export async function editQuotaForAccount(account: Account) {
  const plan = planFor(account);
  const limit = plan.linkEditsPerMonth;
  const periodStart = DateTime.utc().startOf('month');
  const [row] = await LinkEdit.query()
    .where('account_id', account.id)
    .where('created_at', '>=', periodStart.toSQL()!)
    .count('* as total');
  const used = Number(row?.$extras.total ?? 0);

  return {
    plan,
    limit,
    used,
    remaining: limit === null ? null : Math.max(limit - used, 0),
  };
}
