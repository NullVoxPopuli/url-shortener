import Link from '#models/link';
import type { HttpContext } from '@adonisjs/core/http';
import { action } from '../base.js';
import { createLink } from './actions/create.js';
import { deleteLink } from './actions/delete.js';

export default class LinksController {
  async store(context: HttpContext) {
    return action(context, createLink);
  }

  async delete(context: HttpContext) {
    return action(context, deleteLink);
  }

  async index(context: HttpContext) {
    await context.auth.authenticate();

    return {
      included: [],
      links: [],
      data: await Link.query(),
    };
  }
}
