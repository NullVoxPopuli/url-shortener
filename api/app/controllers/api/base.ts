import type { HttpContext } from '@adonisjs/core/http';

export async function action(context: HttpContext, callback: (context: HttpContext) => unknown) {
  let { response } = context;

  try {
    let result = await callback(context);

    /**
     * TODO: handle accept headers
     */
    return {
      data: result,
    };
  } catch (error) {
    response.status(500);

    return {
      errors: [
        {
          status: 500,
          title: error.message,
          details: error.stack,
        },
      ],
    };
  }
}

