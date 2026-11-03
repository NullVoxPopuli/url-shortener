import type { HttpContext } from '@adonisjs/core/http';
import { authenticatedAction } from '../base.js';
import { createDomain, deleteDomain, listDomains } from './actions/domains.js';

export default class DomainsController {
  /**
   * @index
   * @summary list custom domains
   * @description Lists the active account's custom domains.
   */
  async index(context: HttpContext) {
    return authenticatedAction(context, listDomains);
  }

  /**
   * @create
   * @summary add a custom domain
   * @description Adds a custom domain (account admins only; gated by the plan's domain limit).
   */
  async create(context: HttpContext) {
    return authenticatedAction(context, createDomain);
  }

  /**
   * @delete
   * @summary remove a custom domain
   * @description Removes a custom domain (account admins only).
   */
  async delete(context: HttpContext) {
    return authenticatedAction(context, deleteDomain);
  }
}
