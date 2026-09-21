import AccountInvitation from '#models/account_invitation';
import { APP_ORIGIN } from '#start/env';
import { JsonApiResource } from '@evoactivity/jsonapi-adonis';

/**
 * Only rendered to account admins — the token/acceptUrl are the
 * shareable secret.
 */
export default class InvitationResource extends JsonApiResource<AccountInvitation> {
  static model = () => AccountInvitation;
  static type = 'invitation';
  static exposeRelationships = ['account'];

  attributes() {
    return {
      ...this.pick(['role', 'token', 'createdAt', 'expiresAt', 'acceptedAt']),
      acceptUrl: `${APP_ORIGIN}/join/${this.resource.token}`,
    };
  }
}
