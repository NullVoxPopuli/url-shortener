/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import { APP_ORIGIN, AUTH_ORIGIN, DOMAIN } from '#start/env';
import router from '@adonisjs/core/services/router';

function version(name: string, callback: () => unknown) {
  return router.group(() => callback()).prefix(`/${name}`);
}

import { apiThrottle } from '#start/limiter';
import { forceMimeType } from '#middleware/require_jsonapi_mimetype';

/**
 * API Routes
 */
router
  .group(() => {
    version('v1', () => {
      let links = () => import('#controllers/api/v1/links');
      let billing = () => import('#controllers/api/v1/billing');
      let accounts = () => import('#controllers/api/v1/accounts');
      let users = () => import('#controllers/api/v1/users');

      router.get('links', [links, 'index']);
      router.post('links', [links, 'create']);
      // Links are not updatable (for now?)
      router.get('links/:id', [links, 'show']);
      router.delete('links/:id', [links, 'delete']);
      router.get('links/:id/visits', [links, 'visits']);

      router.get('accounts/:id', [accounts, 'show']);
      router.get('accounts/:id/memberships', [accounts, 'memberships']);
      router.get('accounts/:id/invitations', [accounts, 'invitations']);
      router.post('accounts/:id/invitations', [accounts, 'invite']);
      router.get('users/:id', [users, 'show']);

      let memberships = () => import('#controllers/api/v1/memberships');
      let invitations = () => import('#controllers/api/v1/invitations');
      let me = () => import('#controllers/api/v1/me');

      router.post('me/account', [me, 'switchAccount']);

      let domains = () => import('#controllers/api/v1/domains');

      router.get('domains', [domains, 'index']);
      router.post('domains', [domains, 'create']);
      router.delete('domains/:id', [domains, 'delete']);

      router.delete('memberships/:id', [memberships, 'delete']);
      router.post('invitations/accept', [invitations, 'accept']);
      router.delete('invitations/:id', [invitations, 'delete']);

      router.post('billing/checkout', [billing, 'checkout']);
      router.post('billing/portal', [billing, 'portal']);
      router.get('billing/status', [billing, 'status']);
    });
  })
  .use([apiThrottle, forceMimeType])
  .domain(`api.${DOMAIN}`);

/**
 * Browser-friendly billing routes (no JSON:API header enforcement).
 *
 * Kept separate so the /billing/success redirect handler can be visited from
 * a normal browser navigation.
 */
router
  .group(() => {
    version('v1', () => {
      let billing = () => import('#controllers/api/v1/billing');

      router.get('billing/success', [billing, 'success']);
    });
  })
  .use([apiThrottle])
  .domain(`api.${DOMAIN}`);

/**
 * Stripe calls this; signature-verified, so no auth / throttle / MIME
 * enforcement. As a routed request, the bodyparser enforces its size
 * limit and retains the raw body for signature verification.
 */
router
  .group(() => {
    let stripeWebhook = () => import('#controllers/stripe_webhook');

    router.post('stripe/webhook', [stripeWebhook, 'handle']);
  })
  .domain(`api.${DOMAIN}`);

/**
 * OAuth routes (browser redirects, no JSON:API middleware).
 */
router
  .group(() => {
    const github = () => import('#controllers/auth/github');
    const auth = () => import('#controllers/auth');

    router.get('/_/auth/github', [github, 'redirect']);
    router.get('/_/auth/callback/github', [github, 'callback']);
    router.get('/_/auth/me', [auth, 'me']);
    router.get('/_/auth/logout', [auth, 'logout']);
    router.get('/_/unauthenticated', ({ response }) => {
      return response.redirect(`${APP_ORIGIN}/auth/login`);
    });
  })
  .domain(new URL(AUTH_ORIGIN).hostname);

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
router
  .group(() => {
    router.get('/:id', [() => import('#controllers/redirect'), 'findLink']);
    router.get('/', [() => import('#controllers/home'), 'index']);
    router.post('/', [() => import('#controllers/home'), 'createLink']);
  })
  .domain(DOMAIN);

/**
 * Custom-domain hosts match none of the registered domains above, so
 * they fall through to this domainless group: short links only.
 */
router.group(() => {
  router.get('/:id', [() => import('#controllers/redirect'), 'findLink']);
});
