import type { HttpContext } from '@adonisjs/core/http';
import { createLink as create } from './api/v1/actions/create.js';

export default class LoFiLinks {
  async createLink(context: HttpContext) {
    await create(context);
  }
}
