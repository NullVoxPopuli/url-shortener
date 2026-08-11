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

      // Every route is named per jsonapi-adonis' `<type>.<action>`
      // convention: the LinkBuilder derives its namespace from the
      // SERVING route's name (unnamed route → no links in the whole
      // document) and only emits links whose named routes exist.
      router.get('links', [links, 'index']).as('link.index');
      router.post('links', [links, 'create']).as('link.store');
      // Links are not updatable (for now?)
      router.get('links/:id', [links, 'show']).as('link.show');
      router.delete('links/:id', [links, 'delete']).as('link.destroy');
      router.get('links/:id/visits', [links, 'visits']).as('visit.index');

      let linkRelationships = () => import('#controllers/api/v1/link_relationships');

      router
        .get('links/:id/relationships/:relation', [linkRelationships, 'show'])
        .as('link.relationships.show');
      // NOTE: must stay below `links/:id/visits` — `:relation` would
      //       otherwise shadow it.
      router.get('links/:id/:relation', [linkRelationships, 'related']).as('link.related');

      router.post('accounts', [accounts, 'create']).as('account.store');
      router.get('accounts/:id', [accounts, 'show']).as('account.show');
      router.get('accounts/:id/memberships', [accounts, 'memberships']).as('membership.index');
      router.get('accounts/:id/invitations', [accounts, 'invitations']).as('invitation.index');
      router.post('accounts/:id/invitations', [accounts, 'invite']).as('invitation.store');
      router.get('users/:id', [users, 'show']).as('user.show');

      let memberships = () => import('#controllers/api/v1/memberships');
      let invitations = () => import('#controllers/api/v1/invitations');

      let domains = () => import('#controllers/api/v1/domains');
      let apiKeys = () => import('#controllers/api/v1/api_keys');

      router.get('api-keys', [apiKeys, 'index']);
      router.post('api-keys', [apiKeys, 'create']);
      router.delete('api-keys/:id', [apiKeys, 'delete']);

      router.get('domains', [domains, 'index']).as('custom-domain.index');
      router.post('domains', [domains, 'create']).as('custom-domain.store');
      router.delete('domains/:id', [domains, 'delete']).as('custom-domain.destroy');

      router.delete('memberships/:id', [memberships, 'delete']).as('membership.destroy');
      // accepting renders the resulting membership, hence the name
      router.post('invitations/accept', [invitations, 'accept']).as('membership.store');
      router.delete('invitations/:id', [invitations, 'delete']).as('invitation.destroy');

      /**
       * The `related` link targets every document advertises
       * (WarpDrive's linksMode requires them). Registered after the
       * literal segments above so `:relation` never shadows them.
       */
      let related = () => import('#controllers/api/v1/related');

      router.get('accounts/:id/:relation', [related, 'account']).as('account.related');
      router.get('users/:id/:relation', [related, 'user']).as('user.related');
      router.get('memberships/:id/:relation', [related, 'membership']).as('membership.related');
      router.get('invitations/:id/:relation', [related, 'invitation']).as('invitation.related');
      router.get('domains/:id/:relation', [related, 'domain']).as('custom-domain.related');

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
