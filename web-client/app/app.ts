import '@warp-drive/ember/install';

import Application from '@ember/application';

export default class App extends Application {
  modules = {
    ...import.meta.glob('./router.ts', { eager: true }),
    ...import.meta.glob('./routes/**/*.ts', { eager: true }),
    ...import.meta.glob('./services/**/*.ts', { eager: true }),
    ...import.meta.glob(
      [
        './templates/**/*',
        '!./templates/components/**',
        '!./templates/dashboard/**',
        '!./templates/pricing/**',
      ],
      { eager: true }
    ),
  };
}
