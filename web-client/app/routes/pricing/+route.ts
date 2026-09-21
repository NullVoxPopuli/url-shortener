import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { getBillingStatus, getPlans } from '#app/data/requests';

import type { Store } from '@warp-drive/core';
import type CurrentUserService from '#services/current-user';

/**
 * Public. The plan catalog needs no session; the account's billing
 * status is only requested for a signed-in visitor.
 */
export default class PricingRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare store: Store;

  model() {
    // Wrapped in an object: a Future is a thenable, and Ember awaits
    // thenables returned from model(), which would unwrap it.
    return {
      plans: this.store.request(getPlans()),
      billing: this.currentUser.isAuthenticated ? this.store.request(getBillingStatus()) : null,
    };
  }
}
