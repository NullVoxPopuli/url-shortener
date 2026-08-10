import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getBillingStatus, getDomains, getLinks } from '#app/data/requests';

import type { Store } from '@warp-drive/core';

export default class DashboardLinksRoute extends Route {
  @service declare store: Store;

  model() {
    return {
      billing: this.store.request(getBillingStatus()),
      links: this.store.request(getLinks()),
      domains: this.store.request(getDomains()),
    };
  }
}
