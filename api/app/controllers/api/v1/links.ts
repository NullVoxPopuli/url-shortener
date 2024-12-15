import type { HttpContext } from '@adonisjs/core/http';
import { action } from '../base.js';
import { createLink } from './actions/create.js';
import { deleteLink } from './actions/delete.js';
import { showLink } from './actions/show.js';
import { listLinks } from './actions/list.js';

export default class LinksController {
  /**
   * @create
   * @summary create a link
   * @description create a link
   * @operationId null
   */
  async create(context: HttpContext) {
    return action(context, createLink);
  }

  /**
   * @delete
   * @description delete a link
   */
  async delete(context: HttpContext) {
    await context.auth.authenticate();

    return action(context, deleteLink);
  }

  /**
   * @show
   * @description show a link
   */
  async show(context: HttpContext) {
    await context.auth.authenticate();

    return action(context, showLink);
  }

  /**
   * @index
   * @operationId getLinks
   * @description list links
   */
  async index(context: HttpContext) {
    await context.auth.authenticate();

    return action(context, listLinks);
  }
}
