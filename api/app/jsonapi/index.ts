interface Error {
  status?: number;
  title?: string;
  detail?: string;
  source?: { pointer?: string };
}

interface ErrorResponse {
  errors: Error[];
}

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
};
