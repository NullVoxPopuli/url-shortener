/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import env from '#start/env';
import router from '@adonisjs/core/services/router';

function version(name: string, callback: () => unknown) {
  return router.group(() => callback()).prefix(`/${name}`);
}

const HOST = env.get('HOST');

/**
 * API Routes
 */
router
  .group(() => {
    version('v1', () => {
      let links = () => import('#controllers/api/v1/links');

      router.get('links', [links, 'index']);
      router.post('links', [links, 'create']);
      // Links are not updatable (for now?)
      router.get('links/:id', [links, 'show']);
      router.delete('links/:id', [links, 'delete']);
    });
  })
  .domain(`api.${HOST}`);

router
  .group(() => {
    // TODO: docs subdomain for generated API documentation
  })
  .domain(`docs.${HOST}`);

/**
 * "SSR" / Traditional
 * Only two pages:
 * - the redirect
 * - home
 */
router
  .group(() => {
    router.get(':id', [() => import('#controllers/redirect'), 'findLink']);
    router.get('/', [() => import('#controllers/home'), 'index']);
    router.post('/', [() => import('#controllers/home'), 'createLink']);
  })
  .domain(HOST);
