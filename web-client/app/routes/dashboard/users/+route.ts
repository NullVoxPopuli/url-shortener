import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getInvitations, getMemberships } from '#app/data/requests';

import type { Store } from '@warp-drive/core';
import type CurrentUserService from '#services/current-user';

export default class DashboardUsersRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare store: Store;

  model() {
    // the dashboard parent route guarantees authentication
    const accountId = this.currentUser.accountId!;
    const isAdmin = this.currentUser.isAdminOfActiveAccount;

    return {
      accountId,
      isAdmin,
      memberships: this.store.request(getMemberships(accountId)),
      invitations: isAdmin ? this.store.request(getInvitations(accountId)) : null,
    };
  }
}
