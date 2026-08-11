import {
  JSON_API_MEDIA_TYPE,
  JsonApiException,
  renderJsonApiError,
} from '@evoactivity/jsonapi-adonis';
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

function unsupported(context: HttpContext, header: string, used: string) {
  return renderJsonApiError(
    new JsonApiException(
      {
        title: 'Unsupported media type',
        detail: `Expected the ${header} header to be set to ${JSON_API_MEDIA_TYPE}, but instead it was ${used}`,
      },
      { status: 415 }
    ),
    context,
    false
  );
}

export default class RequireJsonAPIMimeType {
  async handle(context: HttpContext, next: NextFn) {
    const headers = context.request.headers();

    if (headers.accept && headers.accept !== JSON_API_MEDIA_TYPE) {
      return unsupported(context, 'Accept', headers.accept);
    }

    if (headers['content-type'] && headers['content-type'] !== JSON_API_MEDIA_TYPE) {
      return unsupported(context, 'Content-Type', headers['content-type']);
    }

    return next();
  }
}

const singleton = new RequireJsonAPIMimeType();

export function forceMimeType(context: HttpContext, next: NextFn) {
  return singleton.handle(context, next);
}
