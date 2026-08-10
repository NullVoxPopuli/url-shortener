import type { HttpContext } from '@adonisjs/core/http';
import { action } from '../base.js';
import { createLink } from './actions/create.js';
import { deleteLink } from './actions/delete.js';
import { showLink } from './actions/show.js';
import { listLinks } from './actions/list.js';
import { listVisits } from './actions/visits.js';

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
  /**
   * NOTE: the links actions authenticate internally — they accept
   *       either the browser session or an API key (Bearer), with
   *       per-scope enforcement.
   */
  async delete(context: HttpContext) {
    return action(context, deleteLink);
  }

  /**
   * @show
   * @description show a link
   */
  async show(context: HttpContext) {
    return action(context, showLink);
  }

  /**
   * @index
   * @operationId getLinks
   * @description list links
   */
  async index(context: HttpContext) {
    return action(context, listLinks);
  }

  /**
   * @visits
   * @operationId getLinkVisits
   * @summary list visits for a link
   * @description Lists recorded visits ("clicks") for one of the caller's links, most recent first.
   */
  async visits(context: HttpContext) {
    return action(context, listVisits);
  }
}
