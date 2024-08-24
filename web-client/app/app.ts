import Application from '@ember/application';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import compatModules from '@embroider/core/entrypoint';

import loadInitializers from 'ember-load-initializers';
import Resolver from 'ember-resolver';
import config from 'web-client/config/environment';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
let d = window.define;

for (const [name, module] of Object.entries(compatModules)) {
  d(name, function () {
    return module;
  });
}

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);
