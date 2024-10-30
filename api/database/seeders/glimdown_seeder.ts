import { DateTime } from 'luxon';
import { BaseSeeder } from '@adonisjs/lucid/seeders';
import Account from '#models/account';
import db from '@adonisjs/lucid/services/db';
import User from '#models/user';

import { glimdownOwner } from '#consts';

/**
 * NOTE: Seeders are not idempotent out of the box
 *      like migrations (sorta)
 * SEE: https://lucid.adonisjs.com/docs/seeders
 */
export default class extends BaseSeeder {
  async run() {
    let existingAccount = await Account.find(glimdownOwner.id);
    let existingUser = await Account.find(glimdownOwner.id);

    await db.transaction(async (trx) => {
      if (!existingAccount) {
        await trx.insertQuery().table(Account.table).insert({
          id: glimdownOwner.id,
          admin_id: glimdownOwner.id,
          name: glimdownOwner.name,
          created_at: DateTime.utc().toSQLDate(),
        });
      }

      if (!existingUser) {
        await trx.insertQuery().table(User.table).insert({
          id: glimdownOwner.id,
          name: glimdownOwner.name,
          account_id: glimdownOwner.id,
          created_at: DateTime.utc().toSQLDate(),
        });
      }
    });
  }
}
