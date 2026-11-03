import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import Account from './account.js';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export default class CustomDomain extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare account_id: string;

  @belongsTo(() => Account, { foreignKey: 'account_id' })
  declare account: BelongsTo<typeof Account>;

  @column()
  declare hostname: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;
}
