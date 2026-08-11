import User from '#models/user';
import { JsonApiResource } from '@evoactivity/jsonapi-adonis';

export default class UserResource extends JsonApiResource<User> {
  static model = () => User;
  static type = 'user';
  static exposeRelationships = ['account'];

  /**
   * Public shape only: the oauth id/token columns must never
   * serialize.
   */
  attributes() {
    return this.pick(['name', 'createdAt', 'updatedAt']);
  }
}
