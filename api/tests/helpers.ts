import limiter from '@adonisjs/limiter/services/main';
import env, { DOMAIN } from '#start/env';
import type { Group } from '@japa/runner/core';

/**
 * The apex ("SSR") routes are domain-scoped, so browser tests must
 * navigate via the apex hostname, not 127.0.0.1.
 */
export function apexUrl(path: string) {
  return `http://${DOMAIN}:${env.get('PORT')}${path}`;
}

export function setup(group: Group) {
  group.each.setup(() => {
    return () => limiter.clear();
  });
}
