import Application from '@ember/application';

import { default as PageTitleService } from 'ember-page-title/services/page-title';

export default class App extends Application {
  modules = {
    ...import.meta.glob('./router.*', { eager: true }),
    ...import.meta.glob('./templates/**/*', { eager: true }),
    ...import.meta.glob('./services/**/*', { eager: true }),
    './services/page-title': PageTitleService,
  };
}
