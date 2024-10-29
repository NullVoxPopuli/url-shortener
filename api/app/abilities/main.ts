import User from '#models/user';
import Link from '#models/link';
import { Bouncer } from '@adonisjs/bouncer';

export const editLink = Bouncer.ability((user: User, link: Link) => {
  return (
    // is the user the creator of this link?
    user.id === link.created_by ||
    // is the user the admin of the account?
    user.id === user.account.admin_id
  );
});

export const deleteLink = Bouncer.ability((user: User, link: Link) => {
  return (
    // is the user the creator of this link?
    user.id === link.created_by ||
    // is the user the admin of the account?
    user.id === user.account.admin_id
  );
});

export const canDisableLink = Bouncer.ability((user: User, link: Link) => {
  return (
    user.account.hasActiveSubscription &&
    // is the user the creator of this link?
    (user.id === link.created_by ||
      // is the user the admin of the account?
      user.id === user.account.admin_id)
  );
});

export const canDefineTimeBehaviors = Bouncer.ability((user: User) => {
  return user.account.hasActiveSubscription;
});
/**
 * Custom domains enable short links
 * (match 8 characters?)
 *  - 64^length
 *  - 64^6 = 68,719,476,736
 *  - 64^8 = 281,474,976,710,656
 *
 *  6 characters is probably sufficient
 */
export const canUseCustomDomain = Bouncer.ability((user: User) => {
  return user.account.hasActiveSubscription && user.account.hasCustomDomain;
});
/**
 * TODO conditions:
 * - number of configured domains does not exceed plan limit
 */
export const canConfigureCustomDomain = Bouncer.ability((user: User) => {
  return user.account.hasActiveSubscription;
});

export const canUseShortLinks = Bouncer.ability((user: User) => {
  return canUseCustomDomain.execute(user) && user.account.hasCustomDomain;
});
