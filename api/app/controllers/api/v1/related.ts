import type { HttpContext } from '@adonisjs/core/http';
import Account from '#models/account';
import AccountInvitation from '#models/account_invitation';
import AccountMembership from '#models/account_membership';
import CustomDomain from '#models/custom_domain';
import User from '#models/user';
import { notFound } from '#exceptions/api_errors';
import { membershipFor } from '#services/team';
import { action } from '../base.js';

/**
 * The `related` link targets (`GET /<type>/:id/:relation`) that every
 * document advertises — WarpDrive's linksMode requires each belongsTo
 * relationship to carry `links.related`, and spec-wise these make the
 * API navigable without URL guessing.
 *
 * Visibility mirrors each resource's own show/list rules; anything
 * else is a 404.
 */
export default class RelatedController {
  async account(context: HttpContext) {
    return action(context, async () => {
      let user = await context.auth.use('web').authenticate();
      let id = context.request.param('id');

      let membership = await membershipFor(user.id, id);
      let account = membership ? await Account.find(id) : null;

      if (!account) {
        throw notFound('Account', id);
      }

      return context.jsonApi.renderRelated(account, context.request.param('relation'));
    });
  }

  async user(context: HttpContext) {
    return action(context, async () => {
      let user = await context.auth.use('web').authenticate();
      let id = context.request.param('id');

      let target = await User.find(id);
      let visible =
        target && (target.id === user.id || (await sharesAnAccount(user.id, target.id)));

      if (!target || !visible) {
        throw notFound('User', id);
      }

      return context.jsonApi.renderRelated(target, context.request.param('relation'));
    });
  }

  async membership(context: HttpContext) {
    return action(context, async () => {
      let user = await context.auth.use('web').authenticate();
      let id = context.request.param('id');

      let membership = await AccountMembership.find(id);
      let callers = membership ? await membershipFor(user.id, membership.account_id) : null;

      if (!membership || !callers) {
        throw notFound('Membership', id);
      }

      return context.jsonApi.renderRelated(membership, context.request.param('relation'));
    });
  }

  async invitation(context: HttpContext) {
    return action(context, async () => {
      let user = await context.auth.use('web').authenticate();
      let id = context.request.param('id');

      let invitation = await AccountInvitation.find(id);
      let callers = invitation ? await membershipFor(user.id, invitation.account_id) : null;

      if (!invitation || callers?.role !== 'admin') {
        throw notFound('Invitation', id);
      }

      return context.jsonApi.renderRelated(invitation, context.request.param('relation'));
    });
  }

  async domain(context: HttpContext) {
    return action(context, async () => {
      let user = await context.auth.use('web').authenticate();
      let id = context.request.param('id');

      let domain = await CustomDomain.find(id);
      let callers = domain ? await membershipFor(user.id, domain.account_id) : null;

      if (!domain || !callers) {
        throw notFound('CustomDomain', id);
      }

      return context.jsonApi.renderRelated(domain, context.request.param('relation'));
    });
  }
}

async function sharesAnAccount(a: string, b: string) {
  let mine = await AccountMembership.query().where('user_id', a);
  let accountIds = mine.map((membership) => membership.account_id);

  if (accountIds.length === 0) return false;

  let shared = await AccountMembership.query()
    .where('user_id', b)
    .whereIn('account_id', accountIds)
    .first();

  return Boolean(shared);
}
