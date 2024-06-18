import Account from '#models/account';
import User from '#models/user';
import db from '@adonisjs/lucid/services/db';

import type { HttpContext } from '@adonisjs/core/http';

export default class GitHubController {
  async callback({ ally, session, auth, response }: HttpContext) {
    const gh = ally.use('github');

    /**
     * User has denied access by canceling
     * the login flow
     */
    if (gh.accessDenied()) {
      return 'You have cancelled the login process';
    }

    /**
     * OAuth state verification failed. This happens when the
     * CSRF cookie gets expired.
     */
    if (gh.stateMisMatch()) {
      return 'We are unable to verify the request. Please try again';
    }

    /**
     * GitHub responded with some error
     */
    if (gh.hasError()) {
      return gh.getError();
    }

    /**
     * Access user info
     */
    const ghUser = await gh.user();
    const accessToken = ghUser.token.token;

    const user = await this.findOrCreate(ghUser.id, ghUser.original.login, accessToken);

    if (!user) {
      throw new Error('failed to find / create user');
    }

    session.put('accessProvider', 'github');
    session.put('accessToken', accessToken);

    await auth.use('web').login(user);
    await auth.authenticate();
    console.log(auth.isAuthenticated);

    response.redirect('/');
  }

  async findOrCreate(id: string, name: string, token: string) {
    let user = await User.findBy({ oauth_github_id: id });

    if (user) {
      return user;
    }

    /**
     * We also need to make an account!
     */
    let account!: Account;
    await db.transaction(async (trx) => {
      user = new User();
      account = new Account();

      user.oauth_github_id = id;
      user.oauth_github_token = token;
      user.name = name;
      account.name = name;

      user.useTransaction(trx);
      account.useTransaction(trx);

      await user.related('account').associate(account);
      await account.related('admin').associate(user);

      user.save();
      account.save();
    });

    return user;
  }
}
