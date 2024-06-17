import type { HttpContext } from '@adonisjs/core/http';
import env from '#start/env';

export default class LinksController {
  async index({ request, view }: HttpContext) {
    let host = request.host();
    let isLocal = host?.includes('localhost');
    let isDev = env.get('NODE_ENV') === 'development';

    return view.render('index', {
      isLocal,
      isDev,
    });
  }
}
