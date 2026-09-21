import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getBillingHistory, getBillingStatus } from '#app/data/requests';

import type { Store } from '@warp-drive/core';

export default class DashboardSettingsBillingRoute extends Route {
  @service declare store: Store;

  model() {
    const { accountId, isAdmin } = this.modelFor('dashboard') as {
      accountId: string;
      isAdmin: boolean;
    };

    return {
      isAdmin,
      billing: this.store.request(getBillingStatus(accountId)),
      // invoices and past subscriptions are admin-only on the api
      history: isAdmin ? this.store.request(getBillingHistory(accountId)) : null,
    };
  }
}
