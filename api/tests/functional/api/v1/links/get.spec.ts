import { test } from '@japa/runner';

test.group('GET v1/links', () => {
  // TODO: needs auth
  test('default endpoint returns a list', async ({ client }) => {
    let response = await client.get('_/api/v1/links');

    response.assertStatus(200);
    // TODO: how to auth in tests?
    //       how to stub out a service in tests?
    //
    //       open api spec? and/or schema? https://docs.adonisjs.com/guides/testing/http-tests#registering-schema
    //         - would make testing the shape easier
    //         - auth / behavior tests should still exist
    //
    // https://jsonapi.org/
    response.assertBody({
      links: [],
      data: [],
      included: [],
    });
  });
});
