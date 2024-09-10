import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';
import { beforeCreate, BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm';
import User from './user.js';
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations';

export default class Account extends BaseModel {
  static selfAssignPrimaryKey = true;

  @column({ isPrimary: true })
  declare id: string;

  @column()
  declare name: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @column()
  declare admin_id: string;

  @column()
  declare isFree: boolean;

  get hasActiveSubscription() {
    console.warn(`Subscription handling is not implemented yet`);
    return false;
  }

  @belongsTo(() => User, { foreignKey: 'admin_id' })
  declare admin: BelongsTo<typeof User>;

  @hasMany(() => User, { foreignKey: 'account_id' })
  declare users: HasMany<typeof User>;

  @beforeCreate()
  static assignUuid(account: Account) {
    account.id ||= randomUUID();
  }
}
