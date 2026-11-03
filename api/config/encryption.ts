import env from '#start/env';
import { defineConfig, drivers } from '@adonisjs/core/encryption';

/**
 * The app key (previously exported from config/app.ts) encrypts cookies
 * and signed URLs. The "legacy" driver reads values encrypted before the
 * v7 upgrade.
 */
export default defineConfig({
  default: 'legacy',
  list: {
    legacy: drivers.legacy({
      keys: [env.get('APP_KEY')],
    }),
  },
});
