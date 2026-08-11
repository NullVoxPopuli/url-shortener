import LinkVisit from '#models/link_visit';
import { JsonApiResource } from '@evoactivity/jsonapi-adonis';

export default class VisitResource extends JsonApiResource<LinkVisit> {
  static model = () => LinkVisit;
  static type = 'visit';
  static exposeRelationships = ['link'];

  attributes() {
    return this.pick(['visitedAt', 'referrer', 'userAgent']);
  }
}
