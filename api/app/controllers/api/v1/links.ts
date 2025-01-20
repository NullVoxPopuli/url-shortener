import type { HttpContext } from '@adonisjs/core/http';
import { action, authenticatedAction } from '../base.js';
import { createLink } from './actions/create.js';
import { deleteLink } from './actions/delete.js';
import { showLink } from './actions/show.js';
import { listLinks } from './actions/list.js';

export default class LinksController {
  /**
   * @create
   * @summary create a link
   * @description Sending a POST to this action will create a Link record, which will can then be used to generate a short URL.
   * @operationId null
   * @responseHeader 201 - Content-Type - application/vnd+api.json
   */
  async create(context: HttpContext) {
    /**
     * NOTE: authentication checks happens internally
     *       as there are some domains which are allowed
     *       to be created from anywhere.
     *
     *       To prevent DoS with garbage requests,
     *       the whole API is rate limited by IP.
     */
    return action(context, createLink);
  }

  /**
   * @delete
   * @description delete a link
   */
  async delete(context: HttpContext) {
    return authenticatedAction(context, deleteLink);
  }

  /**
   * @show
   * @description show a link
   */
  async show(context: HttpContext) {
    return authenticatedAction(context, showLink);
  }

  /**
   * @index
   * @operationId getLinks
   * @description list links
   */
  async index(context: HttpContext) {
    return authenticatedAction(context, listLinks);
  }
}
