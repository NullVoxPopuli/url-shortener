import { useRecommendedStore } from '@warp-drive/core';
import { DefaultCachePolicy } from '@warp-drive/core/store';
import { JSONAPICache } from '@warp-drive/json-api';
import { setBuildURLConfig } from '@warp-drive/utilities/json-api';

import { SCHEMAS } from '#app/data/schemas';
import config from '#config';

import type { Handler } from '@warp-drive/core/request';

setBuildURLConfig({ host: config.apiOrigin, namespace: 'v1' });

/**
 * The default policy invalidates queries only after a create. Updates
 * and deletes change what lists and usage numbers show too, so they
 * invalidate the same way: every type of the records they carry, plus
 * any `cacheOptions.types` on the request.
 */
class MutationCachePolicy extends DefaultCachePolicy {
  didRequest(...args: Parameters<DefaultCachePolicy['didRequest']>) {
    super.didRequest(...args);

    const [request, response, , store] = args;

    if (request.op !== 'updateRecord' && request.op !== 'deleteRecord') return;

    const status = response?.status ?? 0;

    if (status < 200 || status >= 400) return;

    const types = new Set(request.records?.map((record) => record.type));

    request.cacheOptions?.types?.forEach((type) => types.add(type));
    types.forEach((type) => this.invalidateRequestsForType(type, store));
  }
}

/**
 * Every api request rides the session cookie.
 */
const withCredentials: Handler = {
  request(context, next) {
    return next(Object.assign({}, context.request, { credentials: 'include' as const }));
  },
};

export default useRecommendedStore({
  cache: JSONAPICache,
  schemas: SCHEMAS,
  handlers: [withCredentials],
  policy: new MutationCachePolicy({
    apiCacheHardExpires: 15 * 60 * 1000,
    apiCacheSoftExpires: 30 * 1000,
    constraints: {
      headers: { 'X-WarpDrive-Expires': true, 'Cache-Control': true, Expires: true },
    },
  }),
});
