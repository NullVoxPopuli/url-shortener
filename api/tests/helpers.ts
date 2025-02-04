import limiter from '@adonisjs/limiter/services/main';
import type { Group } from '@japa/runner/core';

export function setup(group: Group) {
  group.each.setup(() => {
    return () => limiter.clear();
  });
}
