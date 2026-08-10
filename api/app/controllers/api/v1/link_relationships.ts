import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import { jsonapi } from '#jsonapi';
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

      if ('response' in link) return link.response;

      return context.jsonApi.renderRelationship(link.link, context.request.param('relation'));
    });
  }

  async related(context: HttpContext) {
    return action(context, async () => {
      let link = await this.#findLink(context);

      if ('response' in link) return link.response;

      return context.jsonApi.renderRelated(link.link, context.request.param('relation'));
    });
  }

  async #findLink(context: HttpContext) {
    let authed = await authenticateWithScope(context, 'links:read');

    if ('response' in authed) return authed;

    let id = context.request.param('id');
    let link = await Link.query().where('owned_by', authed.account.id).where('id', id).first();

    if (!link) {
      return { response: jsonapi.notFound({ kind: 'Link', id }) };
    }

    return { link };
  }
}
