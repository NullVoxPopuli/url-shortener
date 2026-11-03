/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main';
import env from './env.js';

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(30).every('1 minute');
});

export const apiThrottle = limiter.define('api', async (ctx) => {
  if (env.get('NODE_ENV') === 'test') {
    return limiter.noLimit() as never;
  }

  // Resolve the session guard before selecting the quota. Do not use Origin
  // for this decision; it is client-controlled and can be spoofed.
  try {
    await ctx.auth.use('web').authenticate();

    // First-party browser requests use the session cookie and are not part of
    // the public API quota.
    return limiter.noLimit() as never;
  } catch {
    // Continue to API-token and anonymous quota selection.
  }

  try {
    /**
     * API keys are quota'd per membership (user-in-account).
     *
     * TODO: determine if this needs to be bumped by subscription
     */
    let membership = await ctx.auth.use('api').authenticate();

    return limiter.allowRequests(100).every('1 minute').usingKey(`membership_${membership.id}`);
  } catch {
    // Anonymous requests use the IP-based limit below.
  }

  return limiter.allowRequests(1).every('1 minute').usingKey(`ip_${ctx.request.ip()}`);
});
