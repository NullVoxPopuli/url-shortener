import type { HttpContext } from '@adonisjs/core/http';
import { action } from '../base.js';
import { createLink } from './actions/create.js';
import { deleteLink } from './actions/delete.js';
import { showLink } from './actions/show.js';
import { listLinks } from './actions/list.js';

export default class LinksController {
  async create(context: HttpContext) {
    return action(context, createLink);
  }

  async delete(context: HttpContext) {
    await context.auth.authenticate();

    return action(context, deleteLink);
  }

  async show(context: HttpContext) {
    await context.auth.authenticate();

    return action(context, showLink);
  }

  async index(context: HttpContext) {
    await context.auth.authenticate();

    return action(context, listLinks);
  }
}
