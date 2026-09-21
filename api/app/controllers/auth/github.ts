import { APP_ORIGIN } from '#start/env';
import Account from '#models/account';
import AccountMembership from '#models/account_membership';
import User from '#models/user';
import db from '@adonisjs/lucid/services/db';
import { glimdownOwner, STAFF_GITHUB_IDS } from '#consts';

import type { HttpContext } from '@adonisjs/core/http';

export default class GitHubController {
  async redirect({ ally }: HttpContext) {
    return ally.use('github').redirect();
  }

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

    await this.ensureSpecialGrants(user);

    session.put('accessProvider', 'github');

    await auth.use('web').login(user);
    await auth.authenticate();

    response.redirect(APP_ORIGIN);
  }

  async findOrCreate(id: string | number, name: string, token: string) {
    /**
     * GitHub's user id is numeric; normalize so it stores and
     * compares as a clean string (not "199018.0").
     */
    let githubId = String(Number.parseInt(String(id), 10));

    let user = await User.findBy({ oauth_github_id: githubId });

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

      user.oauth_github_id = githubId;
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

    await AccountMembership.ensure({
      accountId: account.id,
      userId: user!.id,
      role: 'admin',
    });

    return user;
  }

  /**
   * Staff users get the flag and membership in the glimdown account.
   * Their personal account stays the active/default one.
   */
  async ensureSpecialGrants(user: User) {
    if (!STAFF_GITHUB_IDS.includes(user.oauth_github_id)) return;

    if (!user.isStaff) {
      user.isStaff = true;
      await user.save();
    }

    let glimdown = await Account.find(glimdownOwner.id);

    if (glimdown) {
      await AccountMembership.ensure({
        accountId: glimdown.id,
        userId: user.id,
        role: 'admin',
      });
    }
  }
}
