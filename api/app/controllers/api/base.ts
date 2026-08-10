import { jsonapi, mimeType } from '#jsonapi';
import type { HttpContext } from '@adonisjs/core/http';
import type { Response } from '#jsonapi';
import { JsonApiException, toErrorDocument } from '@evoactivity/jsonapi-adonis';
import type { Document } from '@evoactivity/jsonapi-adonis';

export async function action(
  context: HttpContext,
  callback: (context: HttpContext) => Promise<Response | Document>
) {
  try {
    let result = await callback(context);

    return jsonapi.send(context, result as Response);
  } catch (error) {
    return handleError(context, error);
  }
}

export async function authenticatedAction(
  context: HttpContext,
  callback: (context: HttpContext) => Promise<Response | Document>
) {
  return action(context, async (context) => {
    await context.auth.use('web').authenticate();

    return await callback(context);
  });
}

function handleError(context: HttpContext, error: any) {
  // Uncomment for debugging
  // console.log('catch: ', error.message, error.name);

  /**
   * jsonapi-adonis' spec errors (bad include paths, undeclared
   * filters, malformed params) already know their status and shape.
   */
  if (error instanceof JsonApiException) {
    let { status, body } = toErrorDocument(error, false);

    context.response.status(status);
    context.response.header('Content-Type', mimeType);
    return context.response.json(body);
  }

  if ('name' in error) {
    /**
     * Thrown from
     *   context.auth.authenticateUsing(...)
     */
    if (error.name === 'E_UNAUTHORIZED_ACCESS') {
      return jsonapi.send(context, jsonapi.notAuthenticated(error));
    }
  }

  return jsonapi.send(context, jsonapi.serverError(error));
}
