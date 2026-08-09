import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RouterService from '@ember/routing/router-service';

import type CurrentUserService from '#services/current-user';
import type DashboardService from '#services/dashboard';

export default class PricingRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare dashboard: DashboardService;
  @service declare router: RouterService;

  async beforeModel(transition: Parameters<Route['beforeModel']>[0]) {
    await super.beforeModel(transition);

    if (!this.currentUser.isAuthenticated) {
      return this.router.replaceWith('auth.login');
    }
  }

  async model() {
    await this.dashboard.refresh();
  }
}
