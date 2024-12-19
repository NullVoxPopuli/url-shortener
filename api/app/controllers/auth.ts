import type { HttpContext } from '@adonisjs/core/http';

export default class AuthController {
  /**
   * @no-swagger
   */
  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout();
    response.redirect('/');
  }
}
