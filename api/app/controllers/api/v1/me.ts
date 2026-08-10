import type { HttpContext } from '@adonisjs/core/http';
import { authenticatedAction } from '../base.js';
import { switchAccount } from './actions/switch-account.js';

export default class MeController {
  /**
   * @switchAccount
   * @summary switch the active account
   * @description Sets your active account to another account you belong to.
   */
  async switchAccount(context: HttpContext) {
    return authenticatedAction(context, switchAccount);
  }
}
