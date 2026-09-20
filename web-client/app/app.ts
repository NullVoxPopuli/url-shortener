import '@warp-drive/ember/install';

import Application from '@ember/application';
import { importSync, isDevelopingApp, macroCondition } from '@embroider/macros';

let inspectorSupport: unknown;

if (macroCondition(isDevelopingApp())) {
  importSync('./deprecation-workflow.ts');
  inspectorSupport = importSync('@embroider/legacy-inspector-support/ember-source-4.12');
}

const routes = import.meta.glob('./routes/**/+{route,template}.{ts,gts}', { eager: true });

export default class App extends Application {
  modules = {
    ...import.meta.glob('./router.ts', { eager: true }),
    ...import.meta.glob('./services/**/*.ts', { eager: true }),
    ...customLayout(routes),
  };
  inspector = inspectorSupport;
}

function customLayout(globbed: Record<string, unknown>) {
  const result: Record<string, unknown> = {};

  for (const [key, module] of Object.entries(globbed)) {
    if (key.endsWith('/+route.ts')) {
      const name = key.replace(/^\.\/routes\//, '').replace(/\/\+route.ts$/, '');

      result[`./routes/${ name }`] = module;
      continue;
    }

    if (key.endsWith('/+template.gts')) {
      const name = key.replace(/^\.\/routes\//, '').replace(/\/\+template.gts$/, '');

      result[`./templates/${ name }`] = module;
      continue;
    }

    throw new Error(`Unsupported pattern: ${key}`);
  }

  return result;
}

