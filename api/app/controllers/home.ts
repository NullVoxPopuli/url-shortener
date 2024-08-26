import type { HttpContext } from '@adonisjs/core/http';
import { createLink as create } from './api/v1/actions/create.js';
import { htmlAction } from './base.js';

export default class HomeController {
  async index({ view }: HttpContext) {
    return view.render('index');
  }

  /**
   * This should work with:
   *  - free URLs
   *  - any URL, when logged in
   */
  async createLink(context: HttpContext) {
    let response = await htmlAction(context, () => create(context));

    if ('errors' in response) {
      context.view.render('error', { errors: response.errors });
      return;
    }

    context.view.render('success', { data: response.data });
  }
}
