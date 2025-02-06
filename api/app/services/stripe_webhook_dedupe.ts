import db from '@adonisjs/lucid/services/db';

/**
 * Returns true only for the first successful insert of this Stripe event id.
 * Retries and duplicate deliveries return false.
 */
export async function markStripeEventProcessed(params: {
  eventId: string;
  eventType: string;
  customerId: string | null;
}): Promise<boolean> {
  const { eventId, eventType, customerId } = params;

  const result = await db
    .insertQuery()
    .table('stripe_webhook_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      customer_id: customerId,
    })
    .onConflict('event_id')
    .ignore()
    .returning('event_id');

  const affectedRows = Array.isArray(result) ? result.length : 0;

  return affectedRows > 0;
}
