import { DateTime } from 'luxon';
import { BaseModel, column, belongsTo, beforeCreate, scope } from '@adonisjs/lucid/orm';
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

  @column.dateTime()
  declare expiresAt: DateTime;

  @column()
  declare owned_by: string;

  @belongsTo(() => Account, { foreignKey: 'owned_by' })
  declare ownedBy: BelongsTo<typeof Account>;

  @column()
  declare created_by: string;

  @belongsTo(() => User, { foreignKey: 'created_by' })
  declare createdBy: BelongsTo<typeof User>;

  static selfAssignPrimaryKey = true;

  @beforeCreate()
  static assignUuid(link: Link) {
    link.id = randomUUID();
  }

  static visibleTo = scope((query, user: User) => {
    query.where('owned_by', user.account_id);
  });

  static notExpired = scope((query) => {
    query.whereNull('expiresAt').orWhereNot('expiresAt', '<', DateTime.utc().toSQLDate());
  });

  static expired = scope((query) => {
    query.where('expires_at', '<=', DateTime.utc().toSQLDate());
  });
}
