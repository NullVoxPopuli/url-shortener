import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import Link from './link.js';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export default class LinkVisit extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare link_id: string;

  @belongsTo(() => Link, { foreignKey: 'link_id' })
  declare link: BelongsTo<typeof Link>;

  @column.dateTime()
  declare visitedAt: DateTime;

  @column()
  declare referrer: string | null;

  @column()
  declare userAgent: string | null;
}
