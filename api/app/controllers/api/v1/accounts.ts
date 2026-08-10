import type { HttpContext } from '@adonisjs/core/http';
import { authenticatedAction } from '../base.js';
import { showAccount } from './actions/show-account.js';
import { createInvitation, listInvitations, listMemberships } from './actions/team.js';
import { createAccount } from './actions/create-account.js';

export default class AccountsController {
  /**
   * @show
   * @summary show an account
   * @description Shows the authenticated caller's account. Other accounts are not visible.
   */
  async show(context: HttpContext) {
    return authenticatedAction(context, showAccount);
  }

  /**
   * @create
   * @summary create an additional account
   * @description Creates an additional (non-personal) account, gated by your personal account's plan.
   */
  async create(context: HttpContext) {
    return authenticatedAction(context, createAccount);
  }

  /**
   * @memberships
   * @summary list account members
   * @description Lists the members of an account you belong to.
   */
  async memberships(context: HttpContext) {
    return authenticatedAction(context, listMemberships);
  }

  /**
   * @invitations
   * @summary list pending invitations
   * @description Lists pending invitations (account admins only).
   */
  async invitations(context: HttpContext) {
    return authenticatedAction(context, listInvitations);
  }

  /**
   * @invite
   * @summary create an invitation
   * @description Creates a shareable invitation link (account admins only; gated by the plan's teammate limit).
   */
  async invite(context: HttpContext) {
    return authenticatedAction(context, createInvitation);
  }
}
