import type { HttpContext } from '@adonisjs/core/http';
import { createLink as create } from './api/v1/actions/create.js';
import { htmlAction } from './base.js';

export default class HomeController {
  /**
   * @no-swagger
   */
  async index({ view }: HttpContext) {
    return view.render('index');
  }

  /**
   * @no-swagger
   *
   * This should work with:
   *  - free URLs
   *  - any URL, when logged in
   */
  async createLink(context: HttpContext) {
    let response = await htmlAction(context, () => create(context));
    let data = context.request.body();
    let originalUrl = data.originalUrl;

    if ('errors' in response) {
      return context.view.render('error', {
        originalUrl: originalUrl,
        errors: response.errors,
      });
    }

    return context.view.render('success', { data: response.data });
  }
}
