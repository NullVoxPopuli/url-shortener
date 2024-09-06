import { DateTime } from 'luxon';
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
      let link = await this.getBestResult(id);
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
        let link = await this.getBestResult(uuid);
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
      response.status(404);

      return view.render('redirect/error', {
        id,
        host: request.host(),
      });
    }

    response.redirect().status(308).toPath(url);
  }

  async getBestResult(id: string) {
    let link = await Link.query().preload('ownedBy').where('id', '=', id).first();

    if (!link) {
      return;
    }

    if (link.expiresAt && link.expiresAt < DateTime.utc()) {
      return;
    }

    if (link.ownedBy.isFree) {
      return link;
    }

    return link;
  }
}
