import { DateTime } from 'luxon';

import Account from '#models/account';
import Link from '#models/link';
import { FREE_PLAN, NO_SUBSCRIPTION_PLAN, planForPriceId } from './plans.js';

export async function quotaForAccount(account: Account) {
  const plan = account.isFree
    ? FREE_PLAN
    : planForPriceId(account.stripePriceId) ?? NO_SUBSCRIPTION_PLAN;
  const periodStart = DateTime.utc().startOf('month');
  const used = await Link.query()
    .where('owned_by', account.id)
    .where('created_at', '>=', periodStart.toSQL()!);

  return {
    plan,
    used: used.length,
    remaining: plan.monthlyLinkLimit === null ? null : Math.max(plan.monthlyLinkLimit - used.length, 0),
    periodStart: periodStart.toISO(),
    periodEnd: periodStart.endOf('month').toISO(),
  };
}
