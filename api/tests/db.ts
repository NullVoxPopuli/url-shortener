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

export async function createLink(
  user: User,
  account: Account,
  urlOrOptions?: string | Partial<InstanceType<typeof Link>>
) {
  let link = new Link();

  let options =
    typeof urlOrOptions === 'string'
      ? { original: urlOrOptions }
      : urlOrOptions || ({} as Partial<InstanceType<typeof Link>>);

  Object.assign(link, options);
  link.original =
    'original' in options && options.original
      ? options.original
      : (faker.helpers.arrayElement(nonFreeURLs) ?? faker.internet.url());
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
