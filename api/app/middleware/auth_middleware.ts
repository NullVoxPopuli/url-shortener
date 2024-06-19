import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import type { Authenticators } from '@adonisjs/auth/types';

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/_/lo-fi';

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[];
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo });
    let provider = ctx.session.get('accessProvider');

    switch (provider) {
      case 'github':
        let token = ctx.auth.user?.oauth_github_token;
        if (!token) {
          return ctx.response.redirect(this.redirectTo);
        }
        ctx.ally.use('github').userFromToken(token);
        break;
      default:
        ctx.auth.use('web').logout();
        return ctx.response.redirect(this.redirectTo);
    }
    return next();
  }
}
