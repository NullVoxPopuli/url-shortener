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
   * The logged-in area: URL-scoped by account — /{account-id}/links
   * etc. Switching accounts is purely a URL change (no server state).
   * Renders inside the ApplicationShell (routes/dashboard/+template.gts).
   */
  this.route('dashboard', { path: '/:account_id' }, function () {
    this.route('links');
    this.route('users');
    this.route('domains');
    this.route('api-keys');
  });
  // legacy entry point: forwards to the personal account
  this.route('dashboard-redirect', { path: '/dashboard' });
  this.route('pricing');
  this.route('join', { path: '/join/:token' });
});
