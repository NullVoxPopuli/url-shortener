import { makeLink } from './fixtures';

import type Owner from '@ember/owner';
import type { Store } from '@warp-drive/core';
import type { Link } from '#app/data/types';

/**
 * Puts a link into the store and returns the immutable record, the
 * shape components receive from a request. `makeLink` alone is a plain
 * object, which cannot be checked out for editing.
 */
export function pushLink(owner: Owner, overrides?: Partial<Record<keyof Link, unknown>>): Link {
  const store = owner.lookup('service:store') as Store;
  const { id, ...attributes } = makeLink(overrides);

  store.cache.put({
    content: { data: { type: 'link', id, attributes } },
  });

  const record = store.peekRecord<Link>('link', id);

  if (!record) throw new Error(`link ${String(id)} did not land in the store`);

  return record;
}
