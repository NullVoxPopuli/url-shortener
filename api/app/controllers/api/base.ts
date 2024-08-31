import { jsonapi } from '#jsonapi';
import type { HttpContext } from '@adonisjs/core/http';
import type { Response } from '#jsonapi';

export async function action(
  context: HttpContext,
  callback: (context: HttpContext) => Promise<Response>
) {
  let { response } = context;

  try {
    let result = await callback(context);

    let fallbackStatus = jsonapi.statusFrom(result as any);
    response.safeStatus(fallbackStatus);
    return result;
  } catch (error) {
    // Uncomment for debugging
    // console.log('catch: ', error.message, error.name);

    if ('name' in error) {
      /**
       * Thrown from
       *   context.auth.authenticateUsing(...)
       */
      if (error.name === 'E_UNAUTHORIZED_ACCESS') {
        response.status(401);

        return jsonapi.notAuthenticated(error);
      }
    }

    response.status(500);

    return jsonapi.serverError(error);
  }
}
