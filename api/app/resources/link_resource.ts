import Link from '#models/link';
import { DOMAIN } from '#start/env';
import { JsonApiResource } from '@evoactivity/jsonapi-adonis';

export default class LinkResource extends JsonApiResource<Link> {
  static model = () => Link;
  /** The client's schemas use singular types. */
  static type = 'link';
  static exposeRelationships = ['ownedBy', 'createdBy'];

  attributes() {
    return {
      ...this.pick(['domain', 'original', 'visits', 'createdAt', 'updatedAt', 'expiresAt']),
      shortUrl: `https://${this.resource.domain ?? DOMAIN}/${this.resource.encodedId}`,
    };
  }
}
