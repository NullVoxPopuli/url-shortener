import EmberRouter from '@ember/routing/router';

import config from 'web-client/config/environment';

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
});
