import type { HttpContext } from '@adonisjs/core/http';
import type { Response } from '#jsonapi';
import Account from '#models/account';
import AccountMembership from '#models/account_membership';
import { jsonapi } from '#jsonapi';
import { render } from '#jsonapi/data';
import { planFor } from '#services/plans';

/**
 * Additional (non-personal) accounts, gated by the creator's PERSONAL
 * account plan: side-hobby 1, hobby 2, project 3, unpaid 0,
 * staff/legacy-free unlimited.
 */
export async function createAccount(context: HttpContext): Promise<Response> {
  let { auth, request, response } = context;

  let user = await auth.authenticate();

  let name = String(request.input('name') ?? '').trim();

  if (name.length < 2 || name.length > 64) {
    return jsonapi.unprocessableContent('An account name of 2-64 characters is required');
  }

  let personal = await Account.findOrFail(user.account_id);
  let plan = planFor(personal);
  let limit = user.isStaff ? null : plan.additionalAccounts;

  let existing = await Account.query().where('admin_id', user.id).where('is_personal', false);

  if (limit !== null && existing.length >= limit) {
    return jsonapi.errors((error) => {
      error({
        status: 402,
        title: 'Additional account limit reached',
        detail:
          limit === 0
            ? 'Your plan does not include additional accounts. Upgrade to create one.'
            : `Your plan includes ${limit} additional account(s).`,
      });
    });
  }

  let account = new Account();

  account.name = name;
  account.isPersonal = false;
  account.isFree = false;
  account.admin_id = user.id;
  await account.save();

  await AccountMembership.ensure({ accountId: account.id, userId: user.id, role: 'admin' });

  await account.load('admin');

  response.status(201);

  return render.account(account);
}
