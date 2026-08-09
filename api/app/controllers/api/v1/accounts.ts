import type { HttpContext } from '@adonisjs/core/http';
import { authenticatedAction } from '../base.js';
import { showAccount } from './actions/show-account.js';

export default class AccountsController {
  /**
   * @show
   * @summary show an account
   * @description Shows the authenticated caller's account. Other accounts are not visible.
   */
  async show(context: HttpContext) {
    return authenticatedAction(context, showAccount);
  }
}
