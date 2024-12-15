import Route from '@ember/routing/route';
import { setupTabster } from 'ember-primitives/tabster';


export default class Application extends Route {
  async beforeModel() {
    await setupTabster(this);
  }
}
