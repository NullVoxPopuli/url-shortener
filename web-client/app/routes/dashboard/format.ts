const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDate(value: string | null | undefined) {
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

export function formatUtcDateTime(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : utcDateTimeFormat.format(date);
}
