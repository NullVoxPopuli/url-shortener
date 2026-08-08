import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RouterService from '@ember/routing/router-service';
import type CurrentUserService from '#services/current-user';
import type DashboardService from '#services/dashboard';

export default class DashboardRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare router: RouterService;
  @service declare dashboard: DashboardService;

  afterModel() {
    if (!this.currentUser.isAuthenticated) {
      return this.router.replaceWith('auth.login');
    }
  }
}
