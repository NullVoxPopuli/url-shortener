import { assert } from 'chai';
import { DOMAIN } from '#start/env';
import { ApiClient, ApiResponse } from '@japa/api-client';

export function clientFor(client: ApiClient, url: string) {
  return {
    post: (body = {}) => {
      return client
        .post(url)
        .json(body)
        .header('Accept', 'application/vnd.api+json')
        .header('Content-Type', 'application/vnd.api+json');
    },
  };
}

export function hasRelationship(resource: any, name: string, type: string) {
  let r = relationship(resource, name);

  assert.strictEqual(r.type, type);
}

export function relationship(resource: any, name: string) {
  assert.hasAnyKeys(resource, ['relationships']);
  assert.hasAnyKeys(resource.relationships, [name]);

  return resource.relationships[name];
}

export function attr(resource: any, name: string) {
  assert.hasAnyKeys(resource, ['attributes']);

  return resource.attributes[name];
}

export function hasAttr(resource: any, name: string) {
  assert.ok(attr(resource, name));
}

export function hasUUID(resource: any) {
  assert.hasAnyKeys(resource, ['id']);

  let id = resource.id;

  assert.ok(id.includes('-'));
  assert.strictEqual(id.split('-').length, 5);
}

export function assertWellFormedLinkData(data: any) {
  hasUUID(data);
  hasAttr(data, 'createdAt');
  hasAttr(data, 'updatedAt');
  assert.include(attr(data, 'shortUrl'), `https://${DOMAIN}`);
  assert.ok(attr(data, 'shortUrl').startsWith(`https://${DOMAIN}`));

  hasRelationship(data, 'createdBy', 'user');
  hasRelationship(data, 'ownedBy', 'account');
}

export function assertUnauthorized(response: ApiResponse) {
  response.assertStatus(401);

  let body = response.body();

  assert.strictEqual(body.errors.length, 1);
  assert.strictEqual(body.errors[0].status, 401);
  assert.strictEqual(body.errors[0].title, 'Not Authenticated');
}
