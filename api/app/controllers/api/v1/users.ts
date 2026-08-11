import type { HttpContext } from '@adonisjs/core/http';
import { authenticatedAction } from '../base.js';
import { showUser } from './actions/show-user.js';

export default class UsersController {
  /**
   * @show
   * @summary show a user
   * @description Shows a user within the authenticated caller's account. Other users are not visible.
   */
  async show(context: HttpContext) {
    return authenticatedAction(context, showUser);
  }
}
