import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getApiKeys } from '#app/data/requests';

import type { Store } from '@warp-drive/core';

export default class DashboardApiKeysRoute extends Route {
  @service declare store: Store;

  model() {
    const { accountId } = this.modelFor('dashboard') as {
      accountId: string;
    };

    return {
      accountId,
      apiKeys: this.store.request(getApiKeys(accountId)),
    };
  }
}
