import { jsonapi } from '#jsonapi';
import type { HttpContext } from '@adonisjs/core/http';
import type { Response } from '#jsonapi';

export async function htmlAction(
  context: HttpContext,
  callback: (context: HttpContext) => Promise<Response>
) {
  let { response } = context;

  response.header('content-type', 'text/html; charset=utf-8');

  try {
    /**
     * This could call auth,
     * or any other method that _could_ throw an error.
     */
    let result = await callback(context);

    response.safeStatus(jsonapi.statusFrom(result as any));
    return result;
  } catch (error) {
    // Uncomment for debugging
    console.error('catch: ', error.message, error.name, error.stack);

    if ('name' in error) {
      switch (error.name) {
        /**
         * Thrown from
         *   context.auth.authenticateUsing(...)
         */
        case 'E_UNAUTHORIZED_ACCESS': {
          response.status(401);

          return jsonapi.notAuthenticated(error);
        }
      }
    }

    response.status(500);

    return jsonapi.serverError(error);
  }
}
