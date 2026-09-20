import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type RouterService from '@ember/routing/router-service';
import type Transition from '@ember/routing/transition';
import type CurrentUserService from '#services/current-user';

export default class AuthLoginRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare router: RouterService;

  async beforeModel(transition: Transition) {
    await this.currentUser.loadFromRoute();

    console.log('auth/login');

    console.log('state:', this.currentUser.state);
    console.log('user:', this.currentUser.user);
    console.log('authenticated:', this.currentUser.isAuthenticated);
    if (this.currentUser.isAuthenticated) {
      transition.abort();
      console.log('redirect to dashboard');
      this.router.transitionTo('dashboard');

      return;
    }
  }
}
