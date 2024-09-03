import { test } from '@japa/runner';
import { assert } from 'chai';
import { BaseModel } from '@adonisjs/lucid/orm';
import db from '@adonisjs/lucid/services/db';
import Account from '#models/account';
import User from '#models/user';
import { faker } from '@faker-js/faker';
import Link from '#models/link';

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

export async function createLink(user: User, account: Account, url?: string) {
  let link = new Link();
  link.original = url ?? faker.helpers.arrayElement(nonFreeURLs);
  link.owned_by = account.id;
  link.created_by = user.id;
  await link.save();

  return link;
}

const nonFreeURLs = [
  `https://www.google.com/`,
  `https://www.google.com/maps`,
  `https://news.ycombinator.com/`,
  `https://lite.duckduckgo.com/lite`,
  `https://www.google.com/maps/place/South+Pole,+Antarctica/@-84.9999869,44.9985584,21z/data=!3m1!4b1!4m6!3m5!1s0xb165fce02a3d7ef5:0x142d0eddfdb57ff4!8m2!3d-89.9999999!4d45!16zL20vMDcyX20`,
  `https://www.google.com/maps/place/South+Pole,+Antarctica/@-73.1061568,-13.7791245,3z/data=!4m6!3m5!1s0xb165fce02a3d7ef5:0x142d0eddfdb57ff4!8m2!3d-89.9999999!4d45!16zL20vMDcyX20`,
];

/**
 * Could be useful if we remove bootstrap.ts' withGlobalTransaction
 */
export async function inTransaction(
  name: string,
  callback: NonNullable<Parameters<typeof test>[1]>
) {
  return test(name, async (...args) => {
    try {
      await db.beginGlobalTransaction();
      await callback(...args);
    } finally {
      await db.rollbackGlobalTransaction();
    }
  });
}
