import type { HttpContext } from '@adonisjs/core/http';
import env from '#start/env';

const HOST = env.get('HOST');
const PORT = env.get('PORT');

export default class HomeController {
  async index({ request, view }: HttpContext) {
    let host = request.host();
    let isLocal = host?.includes('localhost') || host?.includes('nvp.local');
    let isDev = env.get('NODE_ENV') === 'development';
    let rootHost = isLocal ? `${HOST}:${PORT}` : HOST;

    return view.render('index', {
      isLocal,
      isDev,
      rootHost,
    });
  }
}
