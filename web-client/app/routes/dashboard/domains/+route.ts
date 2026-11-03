import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getDomains } from '#app/data/requests';

import type { Store } from '@warp-drive/core';

export default class DashboardDomainsRoute extends Route {
  @service declare store: Store;

  model() {
    const { accountId, isAdmin } = this.modelFor('dashboard') as {
      accountId: string;
      isAdmin: boolean;
    };

    return {
      accountId,
      isAdmin,
      domains: this.store.request(getDomains(accountId)),
    };
  }
}
