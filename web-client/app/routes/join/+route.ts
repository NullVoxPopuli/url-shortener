import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { messageFrom } from '#app/data/errors';
import { acceptInvitation } from '#app/data/requests';
import { shortAccountId } from '#utils/account';

import type RouterService from '@ember/routing/router-service';
import type { Store } from '@warp-drive/core';
import type CurrentUserService from '#services/current-user';

export default class JoinRoute extends Route {
  @service declare currentUser: CurrentUserService;
  @service declare router: RouterService;
  @service declare store: Store;

  beforeModel() {
    if (!this.currentUser.isAuthenticated) {
      return this.router.replaceWith('auth.login');
    }
  }

  async model(params: { token: string }) {
    try {
      const result = await this.store.request(acceptInvitation(params.token));
      const accountName = result.content.data?.account?.name ?? 'the account';
      const accountId = result.content.data?.account?.id ?? null;
      const accountSlug = accountId ? shortAccountId(accountId) : null;

      // memberships changed; the switcher reads from currentUser
      await this.currentUser.refresh();

      return { ok: true as const, accountName, accountSlug };
    } catch (error) {
      return { ok: false as const, error: messageFrom(error) };
    }
  }
}
