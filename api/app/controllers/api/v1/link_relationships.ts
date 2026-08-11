import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { notFound } from '#exceptions/api_errors';
import { authenticateWithScope } from '#services/api_keys';
import { action } from '../base.js';

/**
 * Read-only relationship endpoints for links, serving the
 * `links.related` / `links.relationships.self` URLs the documents
 * advertise. Both relationships are belongsTo, so there are no
 * to-many writes to support.
 */
export default class LinkRelationshipsController {
  async show(context: HttpContext) {
    return action(context, async () => {
      let link = await this.#findLink(context);

      return context.jsonApi.renderRelationship(link, context.request.param('relation'));
    });
  }

  async related(context: HttpContext) {
    return action(context, async () => {
      let link = await this.#findLink(context);

      return context.jsonApi.renderRelated(link, context.request.param('relation'));
    });
  }

  async #findLink(context: HttpContext) {
    let { account } = await authenticateWithScope(context, 'links:read');

    let id = context.request.param('id');
    let link = await Link.query().where('owned_by', account.id).where('id', id).first();

    if (!link) {
      throw notFound('Link', id);
    }

    return link;
  }
}
