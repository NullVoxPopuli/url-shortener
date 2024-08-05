import { assert } from 'chai';

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
