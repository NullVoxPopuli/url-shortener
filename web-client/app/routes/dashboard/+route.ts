import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { shortAccountId } from '#utils/account';

import type RouterService from '@ember/routing/router-service';
import type CurrentUserService from '#services/current-user';

/**
 * Auth gate + account-context resolution for the whole logged-in
 * area.
 *
 * The active account IS the URL segment: /{account-id}/...
 * Switching accounts is a pure URL change.
 */
export default class DashboardRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare router: RouterService;

  async beforeModel() {
    await this.currentUser.loadFromRoute();
  }

  model(params: { account_id: string }) {
    if (!this.currentUser.isAuthenticated) {
      this.router.replaceWith('auth.login');

      return;
    }


    const membership = this.currentUser.membershipFor(params.account_id);

    if (!membership) {
      return this.router.replaceWith('dashboard', this.currentUser.personalAccountSlug);
    }

    const accountSlug = shortAccountId(membership.accountId);

    if (params.account_id !== accountSlug) {
      // canonicalize (e.g. a full-uuid URL) to the short form
      return this.router.replaceWith('dashboard', accountSlug);
    }

    return {
      accountId: membership.accountId,
      accountSlug,
      accountName: membership.accountName,
      isAdmin: membership.role === 'admin',
    };
  }
}
