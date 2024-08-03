import { BaseSeeder } from '@adonisjs/lucid/seeders';
import Account from '#models/account';
import User from '#models/user';

import { glimdownOwner } from '#consts';

export default class extends BaseSeeder {
  async run() {
    await Account.create({
      id: glimdownOwner.id,
      admin_id: glimdownOwner.id,
      name: glimdownOwner.name,
    });
    await User.create({
      id: glimdownOwner.id,
      name: glimdownOwner.name,
      account_id: glimdownOwner.id,
    });
  }
}

