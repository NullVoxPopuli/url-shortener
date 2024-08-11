import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';
import { beforeCreate, BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm';
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations';
import Account from './account.js';
import Link from './link.js';
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens';

export default class User extends BaseModel {
  static selfAssignPrimaryKey = true;

  @column({ isPrimary: true })
  declare id: string;

  @column()
  declare name: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null;

  @column()
  declare account_id: string;

  @belongsTo(() => Account, { foreignKey: 'account_id' })
  declare account: BelongsTo<typeof Account>;

  @hasMany(() => Link, { foreignKey: 'created_by' })
  declare links: HasMany<typeof Link>;

  @column()
  declare oauth_github_id: string;

  @column()
  declare oauth_github_token: string;

  @beforeCreate()
  static assignUuid(user: User) {
    user.id ||= randomUUID();
  }

  static accessTokens = DbAccessTokensProvider.forModel(User);
}
