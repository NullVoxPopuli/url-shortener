/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const GH = () => import('#controllers/auth/github')

/**
 * Prefix so that we are more likely to avoid collisions with custom URLs
 * (and custom URLS will require that they be at least so many characters)
 */
router
  .group(() => {
    /**
     * API Routes
     */
    router
      .group(() => {
        router
          .group(() => {
            router.get('links', [() => import('#controllers/api/v1/links'), 'index'])
          })
          .prefix('/v1')
      })
      .prefix('/api')

    /**
     * Auth
     */
    router
      .group(() => {
        router.get('callback/github', [GH, 'callback'])
        router
          .get('/:provider/redirect', ({ ally, params }) => {
            const driverInstance = ally.use(params.provider)

            return driverInstance.redirect()
          })
          .where('provider', /github|google|twitter/)
      })
      .prefix('/auth')

    /**
     * Mostly dev testing as I figure out Adonis
     */
    router
      .group(() => {
        let lofi = () => import('#controllers/lo-fi')

        router.on('/').render('lo-fi/index')
        router.get('/create', [lofi, 'create'])
        router.post('/create', [lofi, 'createLink'])
      })
      .prefix('/lo-fi')
  })
  .prefix('/_')

/**
 * "SSR" / Traditional
 * Only two pages:
 * - the redirect
 * - home
 *
 * Everything else will be SPA, as it's guarded by auth
 */
router.get(':id', [() => import('#controllers/redirect'), 'findLink'])
router.get('/', [() => import('#controllers/home'), 'index'])
