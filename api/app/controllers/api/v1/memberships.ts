import type { HttpContext } from '@adonisjs/core/http';
import { authenticatedAction } from '../base.js';
import { removeMembership } from './actions/team.js';

export default class MembershipsController {
  /**
   * @delete
   * @summary remove a member
   * @description Admins may remove anyone; members may remove themselves (leave). The account owner cannot be removed.
   */
  async delete(context: HttpContext) {
    return authenticatedAction(context, removeMembership);
  }
}
