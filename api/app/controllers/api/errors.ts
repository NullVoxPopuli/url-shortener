import { jsonapi } from '#jsonapi';
import type { HttpContext } from '@adonisjs/core/http';

export default class ErrorsController {
  async notfound(context: HttpContext) {
    let accept = context.request.headers().accept;
    let url = context.request.url;

    console.log({ accept });

    switch (accept) {
      case 'json':
        return context.response.json(jsonapi.notFound({ url: url.toString() }));
      case 'application/html':
        return context.response.send('errors/not-found');
    }

    return context.response.send('errors/not-found');
  }
}
