import Account from '#models/account';
import AccountInvitation from '#models/account_invitation';
import AccountMembership from '#models/account_membership';
import User from '#models/user';
import { planFor } from './plans.js';

export async function membershipFor(userId: string, accountId: string) {
  return AccountMembership.query()
    .where('user_id', userId)
    .where('account_id', accountId)
    .first();
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

/**
 * A user's active account must always be one they belong to; after
 * losing a membership, fall back to the account they administer (the
 * personal account), or any remaining membership.
 */
export async function resetActiveAccount(userId: string, lostAccountId: string) {
  const user = await User.find(userId);

  if (!user || user.account_id !== lostAccountId) return;

  const personal = await Account.query().where('admin_id', user.id).first();
  const remaining = await AccountMembership.query().where('user_id', user.id).first();

  const nextId = personal?.id ?? remaining?.account_id;

  if (nextId) {
    user.account_id = nextId;
    await user.save();
  }
}
