import { jsonapi } from '#jsonapi';
import type { HttpContext } from '@adonisjs/core/http';
import type { Response } from '#jsonapi';

export async function action(
  context: HttpContext,
  callback: (context: HttpContext) => Promise<Response>
) {
  try {
    let result = await callback(context);

    return jsonapi.send(context, result);
  } catch (error) {
    return handleError(context, error);
  }
}

export async function authenticatedAction(
  context: HttpContext,
  callback: (context: HttpContext) => Promise<Response>
) {
  return action(context, async (context) => {
    await context.auth.authenticate();

    return await callback(context);
  });
}

function handleError(context: HttpContext, error: any) {
  // Uncomment for debugging
  // console.log('catch: ', error.message, error.name);

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
