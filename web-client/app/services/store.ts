import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

import { SCHEMAS } from '#app/data/schemas';

export default useRecommendedStore({
  cache: JSONAPICache,
  schemas: SCHEMAS,
});
