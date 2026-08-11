import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RouterService from '@ember/routing/router-service';
import type CurrentUserService from '#services/current-user';

export default class AuthLoginRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare router: RouterService;

  beforeModel() {
    if (this.currentUser.isAuthenticated) {
      return this.router.replaceWith('dashboard');
    }
  }
}
