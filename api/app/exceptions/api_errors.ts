import { JsonApiException } from '@evoactivity/jsonapi-adonis';

/**
 * Throw-ready constructors for the API's recurring error shapes —
 * thin sugar over JsonApiException, which the action wrappers render
 * via toErrorDocument.
 */

/**
 * Scoped lookups miss: indistinguishable from a non-existent id.
 */
export function notFound(kind: string, id?: string) {
  return new JsonApiException(
    {
      title: `${kind} was not found`,
      ...(id ? { detail: `Tried to find a ${kind} via ${id}, but could not find anything.` } : {}),
    },
    { status: 404 }
  );
}

export function notAuthenticated(detail: string) {
  return new JsonApiException({ title: 'Unauthorized', detail }, { status: 401 });
}

export function notAuthorized(detail: string) {
  return new JsonApiException({ title: 'Not Authorized', detail }, { status: 403 });
}

export function unprocessable(detail: string) {
  return new JsonApiException({ title: 'Unprocessable Content', detail }, { status: 422 });
}

export function paymentRequired(title: string, detail: string) {
  return new JsonApiException({ title, detail }, { status: 402 });
}
