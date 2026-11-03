import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import Link from './link.js';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

/**
 * One row per change to a link's destination or expiration. The rows
 * are the edit history, and the monthly edit quota counts them.
 */
export default class LinkEdit extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare link_id: string;

  @belongsTo(() => Link, { foreignKey: 'link_id' })
  declare link: BelongsTo<typeof Link>;

  @column()
  declare account_id: string;

  @column()
  declare edited_by: string;

  @column()
  declare previousOriginal: string;

  @column.dateTime()
  declare previousExpiresAt: DateTime | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;
}
