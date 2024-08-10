import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';
import hash from '@adonisjs/core/services/hash';
import { compose } from '@adonisjs/core/helpers';
import { beforeCreate, BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm';
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid';
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations';
import Account from './account.js';
import Link from './link.js';
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens';

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
});

export default class User extends compose(BaseModel, AuthFinder) {
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
