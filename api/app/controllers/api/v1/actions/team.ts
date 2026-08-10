import type { HttpContext } from '@adonisjs/core/http';
import type { Response } from '#jsonapi';
import Account from '#models/account';
import AccountInvitation from '#models/account_invitation';
import AccountMembership from '#models/account_membership';
import { jsonapi } from '#jsonapi';
import { render } from '#jsonapi/data';
import { membershipFor, resetActiveAccount, teamCapacity } from '#services/team';

/**
 * Shared prologue: the target account, only if the caller belongs to
 * it (optionally: administers it). Anything else is a 404.
 */
async function accountForMember(context: HttpContext, options?: { admin?: boolean }) {
  let { auth, request } = context;

  let user = await auth.authenticate();
  let id = request.param('id');

  let membership = await membershipFor(user.id, id);

  if (!membership || (options?.admin && membership.role !== 'admin')) {
    return { ok: false as const, error: jsonapi.notFound({ kind: 'Account', id }) };
  }

  let account = await Account.find(id);

  if (!account) {
    return { ok: false as const, error: jsonapi.notFound({ kind: 'Account', id }) };
  }

  return { ok: true as const, user, account, membership };
}

export async function listMemberships(context: HttpContext): Promise<Response> {
  let actor = await accountForMember(context);

  if (!actor.ok) return actor.error;

  let memberships = await AccountMembership.query()
    .where('account_id', actor.account.id)
    .preload('user')
    .preload('account', (query) => query.preload('admin'))
    .orderBy('created_at', 'asc');

  context.response.status(200);

  return render.memberships(memberships);
}

export async function createInvitation(context: HttpContext): Promise<Response> {
  let actor = await accountForMember(context, { admin: true });

  if (!actor.ok) return actor.error;

  let capacity = await teamCapacity(actor.account);

  if (capacity.remaining !== null && capacity.remaining <= 0) {
    return jsonapi.errors((error) => {
      error({
        status: 402,
        title: 'Teammate limit reached',
        detail:
          capacity.limit === 0
            ? 'Your plan does not include teammates. Upgrade to invite people.'
            : `Your plan includes ${capacity.limit} teammate(s); counting pending invitations, the team is full.`,
      });
    });
  }

  let invitation = await AccountInvitation.create({
    account_id: actor.account.id,
    invited_by: actor.user.id,
    role: 'member',
  });

  await invitation.load('account', (query) => query.preload('admin'));

  context.response.status(201);

  return render.invitation(invitation);
}

export async function listInvitations(context: HttpContext): Promise<Response> {
  let actor = await accountForMember(context, { admin: true });

  if (!actor.ok) return actor.error;

  let all = await AccountInvitation.query()
    .where('account_id', actor.account.id)
    .whereNull('accepted_at')
    .preload('account', (query) => query.preload('admin'))
    .orderBy('created_at', 'desc');

  context.response.status(200);

  return render.invitations(all.filter((invitation) => invitation.isPending));
}

export async function revokeInvitation(context: HttpContext): Promise<Response> {
  let { auth, request, response } = context;

  let user = await auth.authenticate();
  let id = request.param('id');

  let invitation = await AccountInvitation.find(id);

  if (invitation) {
    let membership = await membershipFor(user.id, invitation.account_id);

    if (membership?.role === 'admin') {
      await invitation.delete();
    }
  }

  response.status(200);

  return jsonapi.empty();
}

export async function acceptInvitation(context: HttpContext): Promise<Response> {
  let { auth, request, response } = context;

  let user = await auth.authenticate();
  let token = request.input('token');

  let invitation = token ? await AccountInvitation.findBy({ token }) : null;

  if (!invitation) {
    return jsonapi.notFound({ message: 'Invitation was not found or has expired' });
  }

  /**
   * Already a member (e.g. re-clicking an accepted link): fine.
   */
  let existing = await membershipFor(user.id, invitation.account_id);

  if (existing) {
    await existing.load('user');
    await existing.load('account', (query) => query.preload('admin'));
    response.status(200);

    return render.membership(existing);
  }

  if (!invitation.isPending) {
    return jsonapi.notFound({ message: 'Invitation was not found or has expired' });
  }

  let account = await Account.find(invitation.account_id);

  if (!account) {
    return jsonapi.notFound({ message: 'Invitation was not found or has expired' });
  }

  let capacity = await teamCapacity(account);

  /**
   * Pending invitations count toward capacity, and this invitation is
   * one of them — so a full team here means the plan shrank or other
   * invitations were accepted first.
   */
  if (capacity.limit !== null && capacity.teammates >= capacity.limit) {
    return jsonapi.errors((error) => {
      error({
        status: 402,
        title: 'Team is full',
        detail: "This account's plan has no room for more teammates.",
      });
    });
  }

  let membership = await AccountMembership.create({
    account_id: account.id,
    user_id: user.id,
    role: invitation.role,
  });

  invitation.acceptedAt = membership.createdAt;
  invitation.accepted_by = user.id;
  await invitation.save();

  await membership.load('user');
  await membership.load('account', (query) => query.preload('admin'));

  response.status(201);

  return render.membership(membership);
}

export async function removeMembership(context: HttpContext): Promise<Response> {
  let { auth, request, response } = context;

  let user = await auth.authenticate();
  let id = request.param('id');

  let membership = await AccountMembership.find(id);

  if (membership) {
    let account = await Account.find(membership.account_id);
    let callers = await membershipFor(user.id, membership.account_id);

    let isSelf = membership.user_id === user.id;
    let isAdmin = callers?.role === 'admin';
    let isOwner = account?.admin_id === membership.user_id;

    /**
     * Admins may remove anyone, members may leave — but the account
     * owner's membership is permanent.
     */
    if (!isOwner && (isAdmin || isSelf)) {
      await membership.delete();
      await resetActiveAccount(membership.user_id, membership.account_id);
    }
  }

  response.status(200);

  return jsonapi.empty();
}
