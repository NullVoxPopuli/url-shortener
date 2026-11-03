import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RouterService from '@ember/routing/router-service';
import type CurrentUserService from '#services/current-user';

/**
 * Legacy /dashboard entry point → the personal account's dashboard.
 */
export default class DashboardRedirectRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare router: RouterService;

  beforeModel() {
    if (!this.currentUser.isAuthenticated) {
      return this.router.replaceWith('auth.login');
    }

    return this.router.replaceWith('dashboard', this.currentUser.personalAccountSlug!);
  }
}
