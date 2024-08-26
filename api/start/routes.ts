/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import { middleware } from '#start/kernel';
import router from '@adonisjs/core/services/router';

const GH = () => import('#controllers/auth/github');

/**
 * API Routes
 */
router
  .group(() => {
    router
      .group(() => {
        let links = () => import('#controllers/api/v1/links');

        router.get('links', [links, 'index']);
        router.post('links', [links, 'store']);
      })
      .prefix('/v1');
    // The auth middleware requires that auth be present.
    // Our links endpoint has optional auth, because we allow
    // some unauthenticated usage on select domains.
    // .use([middleware.auth()]);
  })
  .domain('api');

/**
 * Prefix so that we are more likely to avoid collisions with custom URLs
 * (and custom URLS will require that they be at least so many characters)
 */
router
  .group(() => {
    /**
     * Auth
     */
    router
      .group(() => {
        router.get('logout', [() => import('#controllers/auth'), 'logout']);
        router.get('callback/github', [GH, 'callback']);
        //router.get('callback/google', [GH, 'callback']);
        //router.get('callback/twitter', [GH, 'callback']);
        router
          .get('/:provider/redirect', ({ ally, params }) => {
            //switch (params.provider) {
            //  case 'github':
            //    return ally.use('github').redirect((request) => {
            //      request.scopes(['user:email']);
            //    });
            //  default:
            const driverInstance = ally.use(params.provider);
            return driverInstance.redirect();
            //}
          })
          .where('provider', /github|google|twitter/);
      })
      .prefix('/auth');
  })
  .domain('app');

/**
 * "SSR" / Traditional
 * Only two pages:
 * - the redirect
 * - home
 */
router.get(':id', [() => import('#controllers/redirect'), 'findLink']);
router.get('/', [() => import('#controllers/home'), 'index']);
router.post('/', [() => import('#controllers/home'), 'createLink']);
