import { jsonapi } from '#jsonapi';
import type { HttpContext } from '@adonisjs/core/http';

export async function action(context: HttpContext, callback: (context: HttpContext) => unknown) {
  let { response } = context;

  try {
    let result = await callback(context);

    response.safeStatus(jsonapi.statusFrom(result));
    return result;
  } catch (error) {
    response.status(500);

    return jsonapi.serverError(error);
  }
}
