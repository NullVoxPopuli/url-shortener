import { DateTime } from 'luxon';
import Link from '#models/link';
import LinkVisit from '#models/link_visit';
import logger from '@adonisjs/core/services/logger';
import type { HttpContext } from '@adonisjs/core/http';
import { compressedUUID } from '@nullvoxpopuli/url-compression';
import CustomLink from '#models/custom_link';

export default class LinksController {
  /**
   * @no-swagger
   *
   * TODO: scope to domain
   */
  async findLink({ view, request, response }: HttpContext) {
    const { id } = request.params();

    let link: Link | undefined;

    /*
     * Probably a UUID
     */
    if (id.length === 36) {
      link = await this.getBestResult(id);
    }

    if (!link) {
      let uuid: undefined | string;

      try {
        uuid = compressedUUID.decode(id);
      } catch (e) {
        // Deliberately swallow error
      }

      if (uuid) {
        link = await this.getBestResult(uuid);
      }
    }

    if (!link) {
      /**
       * Custom links may or may not be on a custom domain
       */
      let custom = await CustomLink.findBy({ name: id });
      await custom?.load('link');

      link = custom?.link ?? undefined;
    }

    if (!link) {
      response.status(404);

      return view.render('redirect/error', {
        id,
        host: request.host(),
      });
    }

    await this.recordVisit(link, request);

    response.redirect().status(308).toPath(link.original);
  }

  /**
   * Tracking must never break the redirect: failures are logged
   * and swallowed.
   */
  async recordVisit(link: Link, request: HttpContext['request']) {
    try {
      await Promise.all([
        Link.query().where('id', link.id).increment('visits', 1),
        LinkVisit.create({
          link_id: link.id,
          visitedAt: DateTime.utc(),
          referrer: request.header('referer')?.slice(0, 2048) ?? null,
          userAgent: request.header('user-agent')?.slice(0, 512) ?? null,
        }),
      ]);
    } catch (error) {
      logger.error({ err: error, linkId: link.id }, 'Failed to record link visit');
    }
  }

  async getBestResult(id: string) {
    let link = await Link.query().preload('ownedBy').where('id', '=', id).first();

    if (!link) {
      return;
    }

    if (link.expiresAt && link.expiresAt < DateTime.utc()) {
      return;
    }

    return link;
  }
}
