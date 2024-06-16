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

        console.log(driverInstance)
      })
      .where('provider', /github|google|twitter/)
  })
  .prefix('/auth')

/**
 * "SSR" / Traditional
 * Only two pages:
 * - the redirect
 * - home
 *
 * Everything else will be SPA, as it's guarded by auth
 */
router.get(':id', [() => import('#controllers/redirect'), 'findLink'])
router.on('/').render('index')
