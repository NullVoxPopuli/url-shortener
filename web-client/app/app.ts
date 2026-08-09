import '@warp-drive/ember/install';

import Application from '@ember/application';

const routes = import.meta.glob('./routes/**/+{route,template}.{ts,gts}', { eager: true });

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

console.log(customLayout(routes));

export default class App extends Application {
  modules = {
    ...import.meta.glob('./router.ts', { eager: true }),
    ...import.meta.glob('./services/**/*.ts', { eager: true }),
    ...customLayout(routes),
  };
}
