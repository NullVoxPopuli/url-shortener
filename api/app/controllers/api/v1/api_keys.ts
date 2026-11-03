import type { HttpContext } from '@adonisjs/core/http';
import { authenticatedAction } from '../base.js';
import { createApiKey, listApiKeys, revokeApiKey } from './actions/api_keys.js';

export default class ApiKeysController {
  /**
   * @index
   * @summary list API keys
   * @description Lists the caller's API keys for the active account, with the account-wide quota in meta.
   */
  async index(context: HttpContext) {
    return authenticatedAction(context, listApiKeys);
  }

  /**
   * @create
   * @summary create an API key
   * @description Creates an API key on the caller's membership. The secret is only in this response.
   */
  async create(context: HttpContext) {
    return authenticatedAction(context, createApiKey);
  }

  /**
   * @delete
   * @summary revoke an API key
   * @description Revokes one of the caller's API keys. 404 when there is nothing to revoke.
   */
  async delete(context: HttpContext) {
    return authenticatedAction(context, revokeApiKey);
  }
}
