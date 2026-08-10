import type { HttpContext } from '@adonisjs/core/http';
import Account from '#models/account';
import type User from '#models/user';
import { membershipFor } from './team.js';

/**
 * The account a request operates on. The client says which account
 * via the `account` input (query param or body), mirroring the URL it
 * is on (`/{account-id}/links`); without one, the caller's personal
 * account is used. Membership is required — switching accounts is a
 * pure client-side URL concern, never a database write.
 */
export async function accountContext(context: HttpContext, user: User): Promise<Account | null> {
  let requested = context.request.input('account');

  if (!requested || requested === user.account_id) {
    return Account.find(user.account_id);
  }

  let membership = await membershipFor(user.id, String(requested));

  if (!membership) return null;

  return Account.find(membership.account_id);
}
