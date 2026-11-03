import CustomDomain from '#models/custom_domain';
import { JsonApiResource } from '@evoactivity/jsonapi-adonis';

export default class CustomDomainResource extends JsonApiResource<CustomDomain> {
  static model = () => CustomDomain;
  static type = 'custom-domain';
  static exposeRelationships = ['account'];

  attributes() {
    return this.pick(['hostname', 'createdAt']);
  }
}
