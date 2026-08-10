import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { service } from '@ember/service';

import { shortAccountId } from '#utils/account';

import type RouterService from '@ember/routing/router-service';
import type CurrentUserService from '#services/current-user';

interface Signature {
  Args: {
    accountId: string;
  };
}

/**
 * The active account is the URL segment — switching is navigation,
 * nothing more. Requests carry the account id, so cached data stays
 * cleanly separated per account.
 */
export class AccountSwitcher extends Component<Signature> {
  @service declare currentUser: CurrentUserService;
  @service declare router: RouterService;

  get memberships() {
    return this.currentUser.memberships;
  }

  get showSwitcher() {
    return this.memberships.length > 1;
  }

  switch = (event: Event) => {
    const accountId = (event.target as HTMLSelectElement).value;

    if (!accountId || accountId === this.args.accountId) return;

    void this.router.transitionTo('dashboard', shortAccountId(accountId));
  };

  <template>
    {{#if this.showSwitcher}}
      <label class="account-switcher">
        <span class="visually-hidden">Active account</span>
        <select {{on "change" this.switch}}>
          {{#each this.memberships as |membership|}}
            <option
              value={{membership.accountId}}
              selected={{eq membership.accountId @accountId}}
            >{{membership.accountName}}</option>
          {{/each}}
        </select>
      </label>
    {{/if}}
  </template>
}

function eq(a: string, b: string) {
  return a === b;
}
