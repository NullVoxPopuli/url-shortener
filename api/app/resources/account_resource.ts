import Account from '#models/account';
import { JsonApiResource } from '@evoactivity/jsonapi-adonis';

export default class AccountResource extends JsonApiResource<Account> {
  static model = () => Account;
  static type = 'account';
  static exposeRelationships = ['admin'];

  /**
   * Public shape only: billing/stripe columns stay on the billing
   * endpoints.
   */
  attributes() {
    return this.pick(['name', 'isFree', 'createdAt', 'updatedAt']);
  }
}
