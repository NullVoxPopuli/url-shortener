import { assert } from 'chai';
import { BaseModel } from '@adonisjs/lucid/orm';

export async function changedRecords(klass: typeof BaseModel, fn: () => unknown) {
  let beforeAll = await klass.all();
  let before = beforeAll.length;

  await fn();

  let afterAll = await klass.all();
  let after = afterAll.length;

  assert.strictEqual(
    after,
    before + 1,
    `Before: ${before} After: ${after}. Expected After to be one more than Before.`
  );
}
