import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getDomains } from '#app/data/requests';

import type { Store } from '@warp-drive/core';
import type CurrentUserService from '#services/current-user';

export default class DashboardDomainsRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare store: Store;

  model() {
    return {
      isAdmin: this.currentUser.isAdminOfActiveAccount,
      domains: this.store.request(getDomains()),
    };
  }
}
