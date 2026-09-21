import AccountMembership from '#models/account_membership';
import { JsonApiResource } from '@evoactivity/jsonapi-adonis';

export default class MembershipResource extends JsonApiResource<AccountMembership> {
  static model = () => AccountMembership;
  static type = 'membership';
  static exposeRelationships = ['user', 'account'];

  attributes() {
    return this.pick(['role', 'createdAt']);
  }
}
