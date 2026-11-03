/**
 * Narrowers for the values `dataFromEvent` hands back, which are typed
 * as unknown because the utility converts by input type.
 */

export function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * A checkbox group: one checked box comes back as a string, several as
 * an array, none as nothing.
 */
export function strings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);

  return typeof value === 'string' ? [value] : [];
}
