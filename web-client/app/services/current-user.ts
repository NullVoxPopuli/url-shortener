import { tracked } from '@glimmer/tracking';
import Service from '@ember/service';

import { getPromiseState } from 'reactiveweb/get-promise-state';

import config from '#config';

interface CurrentUserData {
  id: string | number;
  name: string;
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
