import type { HttpContext } from '@adonisjs/core/http';
import Account from '#models/account';
import AccountMembership from '#models/account_membership';
import { paymentRequired, unprocessable } from '#exceptions/api_errors';
import { planFor } from '#services/plans';

/**
 * Additional (non-personal) accounts, gated by the creator's PERSONAL
 * account plan: side-hobby 1, hobby 2, project 3, unpaid 0,
 * staff/legacy-free unlimited.
 */
export async function createAccount(context: HttpContext) {
  let { auth, response } = context;

  let user = await auth.use('web').authenticate();

  let input = await context.jsonApi.deserialize(Account);
  let name = String(input.attributes.name ?? '').trim();

  if (name.length < 2 || name.length > 64) {
    throw unprocessable('An account name of 2-64 characters is required');
  }

  let personal = await Account.findOrFail(user.account_id);
  let plan = planFor(personal);
  let limit = user.isStaff ? null : plan.additionalAccounts;

  let existing = await Account.query().where('admin_id', user.id).where('is_personal', false);

  if (limit !== null && existing.length >= limit) {
    throw paymentRequired(
      'Additional account limit reached',
      limit === 0
        ? 'Your plan does not include additional accounts. Upgrade to create one.'
        : `Your plan includes ${limit} additional account(s).`
    );
  }

  let account = new Account();

  account.name = name;
  account.isPersonal = false;
  account.isFree = false;
  account.admin_id = user.id;
  await account.save();

  await AccountMembership.ensure({ accountId: account.id, userId: user.id, role: 'admin' });

  let fresh = await context.jsonApi.query(Account).where('id', account.id).firstOrFail();

  response.status(201);

  return context.jsonApi.render(fresh);
}
