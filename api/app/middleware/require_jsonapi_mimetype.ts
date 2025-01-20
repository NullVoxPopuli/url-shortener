import { jsonapi, mimeType } from '#jsonapi';
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

export default class RequireJsonAPIMimeType {
  async handle(context: HttpContext, next: NextFn) {
    const headers = context.request.headers();

    if (headers.accept && headers.accept !== mimeType) {
      return jsonapi.send(
        context,
        jsonapi.unsupportedMediaType({ used: headers.accept, header: 'Accept' })
      );
    }

    if (headers['content-type'] && headers['content-type'] !== mimeType) {
      return jsonapi.send(
        context,
        jsonapi.unsupportedMediaType({ used: headers['content-type'], header: 'Content-Type' })
      );
    }

    return next();
  }
}
