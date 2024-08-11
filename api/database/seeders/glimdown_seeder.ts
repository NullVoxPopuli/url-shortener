import { BaseSeeder } from '@adonisjs/lucid/seeders';
import Account from '#models/account';
import db from '@adonisjs/lucid/services/db';
import User from '#models/user';

import { glimdownOwner } from '#consts';

export default class extends BaseSeeder {
  async run() {
    await db.transaction(async (trx) => {
      trx.insertQuery().table(Account.table).insert({
        id: glimdownOwner.id,
        admin_id: glimdownOwner.id,
        name: glimdownOwner.name,
      });
      trx.insertQuery().table(User.table).insert({
        id: glimdownOwner.id,
        name: glimdownOwner.name,
        account_id: glimdownOwner.id,
      });
    });
  }
}
