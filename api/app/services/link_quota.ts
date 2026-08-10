import { DateTime } from 'luxon';

import type Account from '#models/account';
import Link from '#models/link';
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
