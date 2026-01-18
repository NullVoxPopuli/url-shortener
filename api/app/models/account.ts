import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';
import { beforeCreate, BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm';
import User from './user.js';
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  // Stripe “active” statuses (per docs + practical SaaS reality)
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
]);

export default class Account extends BaseModel {
  static selfAssignPrimaryKey = true;

  @column({ isPrimary: true })
  declare id: string;

  @column()
  declare name: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @column()
  declare admin_id: string;

  @column({ columnName: 'is_free' })
  declare isFree: boolean;

  @column({ columnName: 'stripe_customer_id' })
  declare stripeCustomerId: string | null;

  @column({ columnName: 'stripe_subscription_id' })
  declare stripeSubscriptionId: string | null;

  @column({ columnName: 'stripe_subscription_status' })
  declare stripeSubscriptionStatus: string | null;

  @column({ columnName: 'stripe_price_id' })
  declare stripePriceId: string | null;

  @column({ columnName: 'stripe_current_period_start' })
  declare stripeCurrentPeriodStart: number | null;

  @column({ columnName: 'stripe_current_period_end' })
  declare stripeCurrentPeriodEnd: number | null;

  @column({ columnName: 'stripe_cancel_at_period_end' })
  declare stripeCancelAtPeriodEnd: boolean | null;

  @column({ columnName: 'stripe_payment_method_brand' })
  declare stripePaymentMethodBrand: string | null;

  @column({ columnName: 'stripe_payment_method_last4' })
  declare stripePaymentMethodLast4: string | null;

  @column.dateTime({ columnName: 'stripe_last_synced_at' })
  declare stripeLastSyncedAt: DateTime | null;

  get hasActiveSubscription() {
    if (!this.stripeSubscriptionStatus) return false;

    // If Stripe ever sends an unexpected status, treat it as not active.
    return ACTIVE_SUBSCRIPTION_STATUSES.has(this.stripeSubscriptionStatus);
  }
  get hasCustomDomain() {
    console.warn(`Custom domain not configured`);
    return false;
  }

  @belongsTo(() => User, { foreignKey: 'admin_id' })
  declare admin: BelongsTo<typeof User>;

  @hasMany(() => User, { foreignKey: 'account_id' })
  declare users: HasMany<typeof User>;

  @beforeCreate()
  static assignUuid(account: Account) {
    account.id ||= randomUUID();
  }
}
