import Link from '#models/link';
import type { HttpContext } from '@adonisjs/core/http';
import { compressedUUID } from '@nullvoxpopuli/url-compression';
import CustomLink from '#models/custom_link';

export default class LinksController {
  /**
   * TODO: scope to domain
   */
  async findLink({ view, request, response }: HttpContext) {
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
        /**
         * TODO: findAll / query because there can be duplicates
         */
        let link = await Link.query()
          .withScopes((scopes) => scopes.notExpired())
          .first();
        url = link?.original;
      }
    }

    if (!url) {
      /**
       * Custom links may or may not be on a custom domain
       */
      let custom = await CustomLink.findBy({ name: id });
      await custom?.load('link');

      url = custom?.link?.original;
    }

    if (!url) {
      return view.render('redirect/error', {
        id,
        host: request.host(),
      });
    }

    response.redirect(url);
  }
}
