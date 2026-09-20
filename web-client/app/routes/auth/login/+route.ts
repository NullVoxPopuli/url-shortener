import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RouterService from '@ember/routing/router-service';
import type CurrentUserService from '#services/current-user';

export default class AuthLoginRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare router: RouterService;

  async beforeModel() {
    await this.currentUser.loadFromRoute();
  }

  model() {
    if (this.currentUser.isAuthenticated) {
      this.router.replaceWith('dashboard', this.currentUser.personalAccountId);

      return;
    }

  }
}
