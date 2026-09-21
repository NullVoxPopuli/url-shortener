import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { setupTabster } from 'ember-primitives/tabster';

import type CurrentUserService from '#services/current-user';

export default class Application extends Route {
  @service declare currentUser: CurrentUserService;

  async beforeModel() {
    await Promise.all([
      this.currentUser.refresh(),
      setupTabster(this)
    ]);
  }
}
