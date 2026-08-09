import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getBillingStatus, getLinks } from '#app/data/requests';

import type RouterService from '@ember/routing/router-service';
import type { Store } from '@warp-drive/core';
import type CurrentUserService from '#services/current-user';

export default class DashboardRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare router: RouterService;
  @service declare store: Store;

  beforeModel() {
    if (!this.currentUser.isAuthenticated) {
      return this.router.replaceWith('auth.login');
    }
  }

  model() {
    return {
      billing: this.store.request(getBillingStatus()),
      links: this.store.request(getLinks()),
    };
  }
}
