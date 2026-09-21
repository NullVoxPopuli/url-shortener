import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getInvitations, getMemberships } from '#app/data/requests';

import type { Store } from '@warp-drive/core';

export default class DashboardUsersRoute extends Route {
  @service declare store: Store;

  model() {
    const { accountId, isAdmin } = this.modelFor('dashboard') as {
      accountId: string;
      isAdmin: boolean;
    };

    return {
      accountId,
      isAdmin,
      memberships: this.store.request(getMemberships(accountId)),
      invitations: isAdmin ? this.store.request(getInvitations(accountId)) : null,
    };
  }
}
