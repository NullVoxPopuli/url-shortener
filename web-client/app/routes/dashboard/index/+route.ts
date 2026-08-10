import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getBillingStatus, getLinks } from '#app/data/requests';

import type { Store } from '@warp-drive/core';

export default class DashboardIndexRoute extends Route {
  @service declare store: Store;

  model() {
    const { accountId } = this.modelFor('dashboard') as { accountId: string };

    return {
      billing: this.store.request(getBillingStatus(accountId)),
      links: this.store.request(getLinks(accountId)),
    };
  }
}
