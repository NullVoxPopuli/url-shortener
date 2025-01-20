/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import { DOMAIN } from '#start/env';
import router from '@adonisjs/core/services/router';

function version(name: string, callback: () => unknown) {
  return router.group(() => callback()).prefix(`/${name}`);
}

import ForceMimeType from '#middleware/require_jsonapi_mimetype';

const forceMimeType = new ForceMimeType();

/**
 * API Routes
 */
router
  .group(() => {
    // let errors = () => import('#controllers/api/errors');

    version('v1', () => {
      let links = () => import('#controllers/api/v1/links');

      router.get('links', [links, 'index']);
      router.post('links', [links, 'create']);
      // Links are not updatable (for now?)
      router.get('links/:id', [links, 'show']);
      router.delete('links/:id', [links, 'delete']);
    });
  })
  .use([forceMimeType.handle])
  .domain(`api.${DOMAIN}`);

router
  .group(async () => {
    router.get('/swagger', ({ response }) => {
      return response.redirect('/swagger.json');
    });

    router.get('/privacy', ({ view }) => view.render('docs/privacy'));
    router.get('/terms', ({ view }) => view.render('docs/terms'));
    router.get('/', ({ view }) => view.render('docs/scalar-ui', { DOMAIN }));
  })
  .domain(`docs.${DOMAIN}`);

/**
 * "SSR" / Traditional
 * Only two pages:
 * - the redirect
 * - home
 */
router.group(() => {
  router.get('/:id', [() => import('#controllers/redirect'), 'findLink']);
  router.get('/', [() => import('#controllers/home'), 'index']);
  router.post('/', [() => import('#controllers/home'), 'createLink']);
});
