import type { HttpContext } from '@adonisjs/core/http';
import { createLinkFromValues } from './api/v1/actions/create.js';
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
    let data = context.request.body();
    let originalUrl = data.originalUrl ? String(data.originalUrl) : '';
    let response = await htmlAction(context, () =>
      createLinkFromValues(context, { original: originalUrl })
    );

    if ('errors' in response) {
      return context.view.render('error', {
        originalUrl: originalUrl,
        errors: response.errors,
      });
    }

    return context.view.render('success', { data: response.data });
  }
}
