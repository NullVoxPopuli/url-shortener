import type { HttpContext } from '@adonisjs/core/http';
import { authenticatedAction } from '../base.js';
import { acceptInvitation, revokeInvitation } from './actions/team.js';

export default class InvitationsController {
  /**
   * @accept
   * @summary accept an invitation
   * @description Accepts an invitation by token, joining the account as a member.
   */
  async accept(context: HttpContext) {
    return authenticatedAction(context, acceptInvitation);
  }

  /**
   * @delete
   * @summary revoke an invitation
   * @description Revokes a pending invitation (account admins only).
   */
  async delete(context: HttpContext) {
    return authenticatedAction(context, revokeInvitation);
  }
}
