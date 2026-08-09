import { defineConfig } from '@adonisjs/cors';

import { APP_ORIGIN, DOMAIN } from '#start/env';

const allowedOrigins = [APP_ORIGIN, `http://app.${DOMAIN}`, `https://app.${DOMAIN}`];

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: allowedOrigins,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
});

export default corsConfig;
