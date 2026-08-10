import { tracked } from '@glimmer/tracking';
import Service from '@ember/service';

import { getPromiseState } from 'reactiveweb/get-promise-state';

import config from '#config';

export interface CurrentUserMembership {
  accountId: string;
  accountName: string;
  role: 'admin' | 'member';
}

interface CurrentUserData {
  id: string | number;
  name: string;
  isStaff: boolean;
  accountId: string;
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

  get accountId() {
    return this.user?.accountId ?? null;
  }

  get memberships() {
    return this.user?.memberships ?? [];
  }

  get activeMembership() {
    return this.memberships.find((m) => m.accountId === this.accountId) ?? null;
  }

  get isAdminOfActiveAccount() {
    return this.activeMembership?.role === 'admin';
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
