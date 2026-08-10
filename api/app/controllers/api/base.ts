import type { HttpContext } from '@adonisjs/core/http';
import logger from '@adonisjs/core/services/logger';
import { JSON_API_MEDIA_TYPE, toErrorDocument } from '@evoactivity/jsonapi-adonis';

/**
 * Runs a JSON:API action. Success returns the action's document
 * (undefined for 204s); failures — JsonApiException, auth errors,
 * anything — render as spec-compliant error documents via
 * toErrorDocument.
 */
export async function action(
  context: HttpContext,
  callback: (context: HttpContext) => Promise<unknown>
) {
  try {
    let result = await callback(context);

    if (result !== undefined) {
      context.response.header('content-type', JSON_API_MEDIA_TYPE);
    }

    return result;
  } catch (error) {
    let { status, body } = toErrorDocument(error, false);

    if (status >= 500) {
      logger.error({ err: error });
    }

    context.response.status(status);
    context.response.header('content-type', JSON_API_MEDIA_TYPE);

    return body;
  }
}

export async function authenticatedAction(
  context: HttpContext,
  callback: (context: HttpContext) => Promise<unknown>
) {
  return action(context, async (context) => {
    await context.auth.use('web').authenticate();

    return await callback(context);
  });
}
