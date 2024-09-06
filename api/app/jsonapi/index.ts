import logger from '@adonisjs/core/services/logger';

interface Error {
  status?: number;
  title?: string;
  detail?: string;
  source?: { pointer?: string };
}

interface ErrorResponse {
  errors: Error[];
}

export interface DataResponse {
  meta?: unknown;
  data: unknown;
  links?: unknown[];
  included?: unknown[];
}

export type Response = ErrorResponse | DataResponse;

/**
 * One of an error entry
 * https://jsonapi.org/examples/#error-objects
 */
export function error({ title, status, detail }: Error) {
  return {
    title,
    status,
    detail,
  };
}

export function errors() {}

export const jsonapi = {
  empty: (): Response => ({ data: {} }),

  // https://jsonapi.org/examples/#error-objects
  errors: (builder: (builder: typeof createError) => void) => {
    let result: ErrorResponse = {
      errors: [],
    };

    function createError(properties: Error) {
      result.errors.push(error(properties));
    }

    builder(createError);

    return result;
  },
  statusFrom: (payload: Response) => {
    if ('errors' in payload) {
      let status = payload.errors.map((error) => error.status).filter(Boolean) as number[];

      let max = Math.max(...status);
      return max;
    }

    return 200;
  },
  unprocessableContent: (reason: string) => {
    return jsonapi.errors((error) => {
      error({
        status: 422,
        title: 'Unprocessable Content',
        detail: reason,
      });
    });
  },
  notImplemented: () => {
    return jsonapi.errors((error) => {
      error({
        status: 501,
        title: 'Not Implemented',
      });
    });
  },
  notAuthenticated: (e: { stack: string }) => {
    return jsonapi.errors((error) => {
      error({
        status: 401,
        title: 'Not Authenticated',
        detail: e.stack,
      });
    });
  },
  notAuthorized: (e: { stack: string }) => {
    return jsonapi.errors((error) => {
      error({
        status: 403,
        title: 'Not Authorized',
        detail: e.stack,
      });
    });
  },
  notFound: ({ kind, id }: { kind: string; id: string }) => {
    return jsonapi.errors((error) => {
      error({
        status: 404,
        title: `${kind} was not found`,
        detail: `Tried to find a ${kind} via ${id}, but could not find anything.`,
      });
    });
  },
  serverError: (e: { message: string; stack: string }) => {
    logger.error({ err: e });

    return jsonapi.errors((error) => {
      error({
        status: 500,
        /**
         * Don't provide any details / etc, because we could expose
         * or more likely, overwhelm the user.
         *
         * Users don't care about stacks or cryptic messages.
         */
        title: 'Server Error',
      });
    });
  },
};
