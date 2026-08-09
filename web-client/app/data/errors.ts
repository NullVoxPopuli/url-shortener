/**
 * Best-effort human message from a thrown request error:
 * JSON:API error documents first, then Error#message.
 */
export function messageFrom(error: unknown): string {
  if (error && typeof error === 'object') {
    const maybe = error as {
      errors?: Array<{ title?: string; detail?: string }>;
      message?: string;
    };
    const first = maybe.errors?.[0];

    if (first?.detail ?? first?.title) return first.detail ?? first.title ?? '';
    if (maybe.message) return maybe.message;
  }

  return 'Something went wrong. Try again.';
}
