import type { HttpContext } from '@adonisjs/core/http';
import { toErrorDocument } from '@evoactivity/jsonapi-adonis';
import type { Document } from '@evoactivity/jsonapi-adonis';

/**
 * Runs a JSON:API action on behalf of an HTML page: failures come
 * back as an `{ errors }` document with the response status set, and
 * the content type is always text/html (jsonApi.render() stamps the
 * JSON:API media type, which must not win here).
 */
export async function htmlAction(
  context: HttpContext,
  callback: (context: HttpContext) => Promise<Document>
): Promise<Document> {
  let { response } = context;

  try {
    let result = await callback(context);

    response.header('content-type', 'text/html; charset=utf-8');
    return result;
  } catch (error) {
    let { status, body } = toErrorDocument(error, false);

    response.status(status);
    response.header('content-type', 'text/html; charset=utf-8');
    return body;
  }
}
