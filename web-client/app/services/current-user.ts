import { tracked } from '@glimmer/tracking';
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
  @tracked refreshPromise: Promise<CurrentUserData | null > | undefined;

  get state() {
    return getPromiseState(this.refreshPromise);
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
    let id = this.personalAccountId;

    return id ? shortAccountId(id) : null;
  }

  isAdminOf(accountId: string) {
    return this.membershipFor(accountId)?.role === 'admin';
  }

  async refresh() {
    this.refreshPromise = this.fetchCurrentUser();
    await this.refreshPromise;
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
          console.debug('Authenticated', this.isAuthenticated);

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

declare module '@ember/service' {
  interface Registry {
    'current-user': CurrentUserService;
  }
}
