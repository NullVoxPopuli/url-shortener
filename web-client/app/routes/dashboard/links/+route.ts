import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getBillingStatus, getDomains, getLinks } from '#app/data/requests';

import type { Store } from '@warp-drive/core';

export default class DashboardLinksRoute extends Route {
  @service declare store: Store;

  /**
   * nvp.ui's Pagination links change `page` in the URL.
   */
  queryParams = {
    page: { refreshModel: true },
  };

  model(params: { page?: string }) {
    const { accountId } = this.modelFor('dashboard') as { accountId: string };

    return {
      accountId,
      billing: this.store.request(getBillingStatus(accountId)),
      links: this.store.request(getLinks(accountId, { number: Number(params.page) || 1 })),
      domains: this.store.request(getDomains(accountId)),
    };
  }
}
