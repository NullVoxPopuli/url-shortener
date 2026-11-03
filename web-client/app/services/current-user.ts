import { cached, tracked } from '@glimmer/tracking';
import Service from '@ember/service';

import { getPromiseState } from 'reactiveweb/get-promise-state';

import config from '#config';
import { shortAccountId } from '#utils/account';

export interface CurrentUserMembership {
  accountId: string;
  accountName: string;
  isPersonal: boolean;
  role: 'admin' | 'member';
}

interface CurrentUserData {
  id: string | number;
  name: string;
  isStaff: boolean;
  personalAccountId: string;
  memberships: CurrentUserMembership[];
}

interface CurrentUserResponse {
  authenticated: boolean;
  user: CurrentUserData | null;
}

export default class CurrentUserService extends Service {
  #refreshPromise = tracked<Promise<CurrentUserData | null > | undefined>(undefined);

  get state() {
    return getPromiseState(this.#refreshPromise.value);
  }

  get user() {
    return this.state.resolved;
  }

  get isLoading() {
    return this.state.isLoading;
  }

  get isAuthenticated() {
    return Boolean(this.user)
  }

  get personalAccountId() {
    return this.user?.personalAccountId ?? null;
  }

  get memberships() {
    return this.user?.memberships ?? [];
  }

  /**
   * Accepts a full account id or the 8-char URL slug.
   */
  membershipFor(idOrSlug: string) {
    if (!idOrSlug) return null;

    return this.memberships.find((m) => m.accountId.startsWith(idOrSlug)) ?? null;
  }

  get personalAccountSlug() {
    const id = this.personalAccountId;

    return id ? shortAccountId(id) : null;
  }

  isAdminOf(accountId: string) {
    return this.membershipFor(accountId)?.role === 'admin';
  }

  async loadFromRoute() {
    if (!this.#refreshPromise.value) {
      await this.refresh();
    }

    await this.#refreshPromise.value;
  }

  async refresh() {
    this.#refreshPromise.value = this.fetchCurrentUser();
    await this.#refreshPromise.value;
  }

  private async fetchCurrentUser(): Promise<CurrentUserData | null> {
    load: {
      try {
        const response = await fetch(`${config.authOrigin}/_/auth/me`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) break load;

        const data = (await response.json()) as CurrentUserResponse;

        if (data.authenticated) {
          console.debug('Authenticated');

          return data.user;
        }
      } catch (e) {
        console.error(e);
      }
    }

    console.debug('Not authenticated');

    return null;
  }
}
