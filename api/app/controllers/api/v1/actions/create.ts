import type { HttpContext } from '@adonisjs/core/http';
import { jsonapi } from '#jsonapi';

export async function createLink({ request, response }: HttpContext) {
  let data = request.body();
  let originalUrl = data.originalUrl;

  if (!URL.canParse(originalUrl)) {
    response.status(422);
    return jsonapi.errors((error) => {
      error({
        status: 422,
        title: 'Cannot parse URL, check the URL',
      });
    });
  }
}

export function createUnmeteredLink() {}
