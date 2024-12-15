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
import AutoSwagger from 'adonis-autoswagger';
import swagger from '#config/swagger';

function version(name: string, callback: () => unknown) {
  return router.group(() => callback()).prefix(`/${name}`);
}

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
  .domain(`api.${DOMAIN}`);

router
  .group(async () => {
    // const { default: swagger } = await import('#config/swagger');
    // const { default: AutoSwagger } = await import('adonis-autoswagger');

    router.get('/swagger', async () => {
      return AutoSwagger.default.docs(router.toJSON(), swagger);
    });

    router.get('/', () => {
      return AutoSwagger.default.ui('/swagger', swagger);
    });
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
