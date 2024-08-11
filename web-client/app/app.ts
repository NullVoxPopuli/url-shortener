import Application from '@ember/application';
import { setBuildURLConfig } from '@ember-data/request-utils';
// @ts-expect-error hmmmm
import compatModules from '@embroider/core/entrypoint';

import loadInitializers from 'ember-load-initializers';
import Resolver from 'ember-resolver';
import config from 'web-client/config/environment';

// @ts-expect-error - temporary
let d = window.define;

for (const [name, module] of Object.entries(compatModules)) {
  d(name, function () {
    return module;
  });
}

setBuildURLConfig({
  host: 'https://nvp.gg',
  namespace: '_/v1',
});

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);
