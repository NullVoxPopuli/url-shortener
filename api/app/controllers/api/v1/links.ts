import Link from '#models/link';
import type { HttpContext } from '@adonisjs/core/http';
import { compressedUUID } from '@nullvoxpopuli/url-compression';
import CustomLink from '#models/custom_link';
import { action } from '../base.js';
import { createLink } from './actions/create.js';

export default class LinksController {
  async store(context: HttpContext) {
    await context.auth.use('web').check();

    return action(context, async ({ request, response }) => {
      return await createLink(context);
    });
  }

  async index({}: HttpContext) {
    return {
      included: [],
      links: [],
      data: await Link.query(),
    };
  }

  async findLink({ request, response }: HttpContext) {
    const { id } = request.params();

    let url: undefined | string;
    /*
     * Probably a UUID
     */
    if (id.length === 36) {
      let link = await Link.find(id);
      url = link?.original;
    }

    if (!url) {
      let uuid: undefined | string;

      try {
        uuid = compressedUUID.decode(id);
      } catch (e) {
        // Deliberately swallow error
      }

      if (uuid) {
        let link = await Link.find(uuid);
        url = link?.original;
      }
    }

    if (!url) {
      let custom = await CustomLink.findBy({ name: id });
      await custom?.load('link');

      url = custom?.link?.original;
    }

    if (!url) {
      return response.redirect().status(404).toRoute('links.notFound', { id });
    }

    response.redirect(url);
  }
}
