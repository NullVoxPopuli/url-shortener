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
  this.route('dashboard');
  this.route('pricing');
});
