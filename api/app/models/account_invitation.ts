import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm';
import Account from './account.js';
import User from './user.js';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';
import type { MembershipRole } from './account_membership.js';

export default class AccountInvitation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare account_id: string;

  @belongsTo(() => Account, { foreignKey: 'account_id' })
  declare account: BelongsTo<typeof Account>;

  @column()
  declare invited_by: string;

  @belongsTo(() => User, { foreignKey: 'invited_by' })
  declare invitedBy: BelongsTo<typeof User>;

  @column()
  declare token: string;

  @column()
  declare role: MembershipRole;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime()
  declare expiresAt: DateTime;

  @column.dateTime()
  declare acceptedAt: DateTime | null;

  @column()
  declare accepted_by: string | null;

  @beforeCreate()
  static assignToken(invitation: AccountInvitation) {
    invitation.token ||= randomUUID();
    invitation.expiresAt ||= DateTime.utc().plus({ days: 7 });
  }

  get isExpired() {
    return this.expiresAt < DateTime.utc();
  }

  get isPending() {
    return !this.acceptedAt && !this.isExpired;
  }
}
