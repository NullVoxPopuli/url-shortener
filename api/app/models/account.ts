import { DateTime } from 'luxon';
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm';
import User from './user.js';
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations';

export default class Account extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @column()
  declare admin_id: number;

  @belongsTo(() => User, { foreignKey: 'admin_id' })
  declare admin: BelongsTo<typeof User>;

  @hasMany(() => User, { foreignKey: 'account_id' })
  declare users: HasMany<typeof User>;
}
