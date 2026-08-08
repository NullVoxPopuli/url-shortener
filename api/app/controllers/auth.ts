import type { HttpContext } from '@adonisjs/core/http';
import { APP_ORIGIN } from '#start/env';

export default class AuthController {
  /**
   * @no-swagger
   */
  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout();
    response.redirect(APP_ORIGIN);
  }
}
