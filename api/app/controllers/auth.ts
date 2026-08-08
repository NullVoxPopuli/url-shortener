import type { HttpContext } from '@adonisjs/core/http';
import { APP_ORIGIN } from '#start/env';

export default class AuthController {
  /**
   * @no-swagger
   */
  async me({ auth, response }: HttpContext) {
    try {
      const user = await auth.use('web').authenticate();

      return response.ok({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
        },
      });
    } catch {
      return response.ok({ authenticated: false, user: null });
    }
  }

  /**
   * @no-swagger
   */
  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout();
    response.redirect(APP_ORIGIN);
  }
}
