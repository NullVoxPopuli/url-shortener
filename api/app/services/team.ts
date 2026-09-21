import type Account from '#models/account';
import AccountInvitation from '#models/account_invitation';
import AccountMembership from '#models/account_membership';
import { planFor } from './plans.js';

export async function membershipFor(userId: string, accountId: string) {
  return AccountMembership.query().where('user_id', userId).where('account_id', accountId).first();
}

/**
 * How many more teammates the account's plan allows.
 * The account admin does not count as a teammate.
 */
export async function teamCapacity(account: Account) {
  const plan = planFor(account);
  const limit = plan.teammates;

  const members = await AccountMembership.query().where('account_id', account.id);
  const teammates = members.filter((m) => m.user_id !== account.admin_id).length;

  const invitations = await AccountInvitation.query()
    .where('account_id', account.id)
    .whereNull('accepted_at');
  const pending = invitations.filter((i) => i.isPending).length;

  return {
    limit,
    teammates,
    pending,
    remaining: limit === null ? null : Math.max(limit - teammates - pending, 0),
  };
}
