import { BaseSeeder } from '@adonisjs/lucid/seeders';
import db from '@adonisjs/lucid/services/db';
import Account from '#models/account';
import User from '#models/user';

import { glimdownOwner } from '#consts';

export default class extends BaseSeeder {
  async run() {
    let user!: User;
    let account!: Account;
    await db.transaction(async (trx) => {
      user = new User();
      account = new Account();

      user.id = glimdownOwner.id;
      user.name = glimdownOwner.name;
      account.id = glimdownOwner.id;
      account.name = glimdownOwner.name;

      user.useTransaction(trx);
      account.useTransaction(trx);

      await user.related('account').associate(account);
      await account.related('admin').associate(user);

      user.save();
      account.save();
    });
  }
}

