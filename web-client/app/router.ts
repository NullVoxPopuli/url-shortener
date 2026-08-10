import EmberRouter from '@embroider/router';

import { properLinks } from 'ember-primitives/proper-links';

import config from '#config';

@properLinks
export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  // Add route declarations here
  this.route('auth', function () {
    this.route('login');
    this.route('logout');
    this.route('signup');
  });
  /**
   * The logged-in area: everything under /dashboard renders inside
   * the ApplicationShell (see routes/dashboard/+template.gts).
   */
  this.route('dashboard', function () {
    this.route('links');
    this.route('users');
    this.route('domains');
  });
  this.route('pricing');
  this.route('join', { path: '/join/:token' });
});
