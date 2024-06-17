import { DateTime } from 'luxon';
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm';
import Account from './account.js';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';
import User from './user.js';
import { randomUUID } from 'node:crypto';

export default class Link extends BaseModel {
  @column({ isPrimary: true })
  declare id: string;

  @column()
  declare original: string;

  @column()
  declare visits: number;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @column()
  declare owned_by: number;

  @belongsTo(() => Account, { foreignKey: 'owned_by' })
  declare ownedBy: BelongsTo<typeof Account>;

  @column()
  declare created_by: number;

  @belongsTo(() => User, { foreignKey: 'created_by' })
  declare createdBy: BelongsTo<typeof User>;

  static selfAssignPrimaryKey = true;

  @beforeCreate()
  static assignUuid(link: Link) {
    link.id = randomUUID();
  }
}
