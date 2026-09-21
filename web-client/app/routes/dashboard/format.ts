const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDate(value: number | string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date);
}

/**
 * Quota periods are UTC-month boundaries, so the reset moment is
 * rendered in UTC (with the zone shown) rather than the viewer's
 * local date, which can be off by a day.
 */
const utcDateTimeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

export function formatUtcDateTime(value: number | string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : utcDateTimeFormat.format(date);
}

const moneyFormats = new Map<string, Intl.NumberFormat>();

/**
 * Stripe amounts are integer minor units (cents for USD).
 */
export function formatMoney(cents: number | null | undefined, currency = 'usd') {
  if (cents === null || cents === undefined) return '—';

  const code = currency.toUpperCase();
  let format = moneyFormats.get(code);

  if (!format) {
    format = new Intl.NumberFormat('en-US', { style: 'currency', currency: code });
    moneyFormats.set(code, format);
  }

  return format.format(cents / 100);
}
