import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import Account from './account.js';
import User from './user.js';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export type MembershipRole = 'admin' | 'member';

export default class AccountMembership extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare account_id: string;

  @belongsTo(() => Account, { foreignKey: 'account_id' })
  declare account: BelongsTo<typeof Account>;

  @column()
  declare user_id: string;

  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>;

  @column()
  declare role: MembershipRole;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  /**
   * Idempotently grant membership.
   */
  static async ensure(params: { accountId: string; userId: string; role?: MembershipRole }) {
    let { accountId, userId, role = 'member' } = params;

    let existing = await AccountMembership.query()
      .where('account_id', accountId)
      .where('user_id', userId)
      .first();

    if (existing) return existing;

    return AccountMembership.create({
      account_id: accountId,
      user_id: userId,
      role,
    });
  }
}
