import AccountMembership from '#models/account_membership';
import type { HttpContext } from '@adonisjs/core/http';
import { APP_ORIGIN } from '#start/env';

export default class AuthController {
  /**
   * @no-swagger
   */
  async me({ auth, response }: HttpContext) {
    try {
      const user = await auth.use('web').authenticate();

      const memberships = await AccountMembership.query()
        .where('user_id', user.id)
        .preload('account')
        .orderBy('created_at', 'asc');

      return response.ok({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          isStaff: Boolean(user.isStaff),
          personalAccountId: user.account_id,
          memberships: memberships.map((membership) => ({
            accountId: membership.account_id,
            accountName: membership.account.name,
            isPersonal: Boolean(membership.account.isPersonal),
            role: membership.role,
          })),
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
