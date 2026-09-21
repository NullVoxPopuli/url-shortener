import { test } from '@japa/runner';
import { assert } from 'chai';
import { API_DOMAIN, APP_ORIGIN } from '#start/env';
import { setup } from '#tests/helpers';

/**
 * The web client runs on another origin, so the browser preflights
 * every PATCH and DELETE. The api must answer for each method it routes.
 */
test.group('CORS preflight', (group) => {
  setup(group);

  for (const method of ['PATCH', 'DELETE', 'POST']) {
    test(`${method} is allowed from the app origin`, async ({ client }) => {
      const response = await client
        .options(`http://${API_DOMAIN}/v1/links/00000000-0000-0000-0000-000000000000`)
        .header('Origin', APP_ORIGIN)
        .header('Access-Control-Request-Method', method)
        .header('Access-Control-Request-Headers', 'content-type');

      assert.include([200, 204], response.status());
      assert.strictEqual(response.header('access-control-allow-origin'), APP_ORIGIN);
      assert.include(response.header('access-control-allow-methods') ?? '', method);
      assert.strictEqual(response.header('access-control-allow-credentials'), 'true');
    });
  }
});
