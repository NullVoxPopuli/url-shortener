import { DateTime } from 'luxon';
import { BaseModel, column } from '@adonisjs/lucid/orm';

export default class StripeWebhookEvent extends BaseModel {
  static table = 'stripe_webhook_events';

  @column({ isPrimary: true, columnName: 'event_id' })
  declare eventId: string;

  @column({ columnName: 'event_type' })
  declare eventType: string;

  @column({ columnName: 'customer_id' })
  declare customerId: string | null;

  @column.dateTime({ columnName: 'processed_at' })
  declare processedAt: DateTime;
}
