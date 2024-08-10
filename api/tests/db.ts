import { assert } from 'chai';
import { BaseModel } from '@adonisjs/lucid/orm';
import db from '@adonisjs/lucid/services/db';
import Account from '#models/account';
import User from '#models/user';
import { faker } from '@faker-js/faker';

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

export async function createNewAccount() {
  let user!: User;
  let account!: Account;
  await db.transaction(async (trx) => {
    user = new User();
    account = new Account();

    user.name = faker.internet.userName();
    account.name = faker.company.name();

    user.useTransaction(trx);
    account.useTransaction(trx);

    await user.related('account').associate(account);
    await account.related('admin').associate(user);

    user.save();
    account.save();
  });

  return { user, account };
}
