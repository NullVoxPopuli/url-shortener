import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RouterService from '@ember/routing/router-service';
import type CurrentUserService from '#services/current-user';

/**
 * Auth gate for the whole logged-in area: every route nested under
 * `dashboard` inherits this check.
 */
export default class DashboardRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare router: RouterService;

  beforeModel() {
    if (!this.currentUser.isAuthenticated) {
      return this.router.replaceWith('auth.login');
    }
  }
}
