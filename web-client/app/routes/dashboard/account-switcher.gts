import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { service } from '@ember/service';

import { switchAccount } from '#app/data/requests';

import type { Store } from '@warp-drive/core';
import type CurrentUserService from '#services/current-user';

/**
 * Flips the ACTIVE account. A full page load afterward guarantees no
 * cached data from the previous account survives the switch.
 */
export class AccountSwitcher extends Component {
  @service declare currentUser: CurrentUserService;
  @service declare store: Store;

  @tracked isWorking = false;

  get memberships() {
    return this.currentUser.memberships;
  }

  get activeAccountId() {
    return this.currentUser.accountId ?? '';
  }

  switch = async (event: Event) => {
    const accountId = (event.target as HTMLSelectElement).value;

    if (!accountId || accountId === this.activeAccountId) return;

    this.isWorking = true;

    try {
      await this.store.request(switchAccount(accountId));
      window.location.assign('/dashboard');
    } catch {
      this.isWorking = false;
    }
  };

  <template>
    {{#if this.showSwitcher}}
      <label class="account-switcher">
        <span class="visually-hidden">Active account</span>
        <select disabled={{this.isWorking}} {{on "change" this.switch}}>
          {{#each this.memberships as |membership|}}
            <option
              value={{membership.accountId}}
              selected={{eq membership.accountId this.activeAccountId}}
            >{{membership.accountName}}</option>
          {{/each}}
        </select>
      </label>
    {{/if}}
  </template>

  get showSwitcher() {
    return this.memberships.length > 1;
  }
}

function eq(a: string, b: string) {
  return a === b;
}
