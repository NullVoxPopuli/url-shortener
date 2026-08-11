import Component from '@glimmer/component';
import { service } from '@ember/service';

import { Menu } from 'nvp.ui';

import { shortAccountId } from '#utils/account';

import type CurrentUserService from '#services/current-user';

interface Signature {
  Args: {
    accountId: string;
  };
}

function eq(a: string, b: string) {
  return a === b;
}

/**
 * The active account is the URL segment — switching is navigation,
 * nothing more. Requests carry the account id, so cached data stays
 * cleanly separated per account.
 */
export class AccountSwitcher extends Component<Signature> {
  @service declare currentUser: CurrentUserService;

  get memberships() {
    return this.currentUser.memberships;
  }

  get current() {
    return this.memberships.find((membership) => membership.accountId === this.args.accountId);
  }

  get hasMultiple() {
    return this.memberships.length > 1;
  }

  <template>
    <div class="account-switcher">
      {{#if this.hasMultiple}}
        <Menu as |menu|>
          <menu.Trigger class="trigger" aria-label="Switch account">
            {{this.current.accountName}}
          </menu.Trigger>

          <menu.Content as |content|>
            {{#each this.memberships as |membership|}}
              <content.LinkItem
                @href="/{{shortAccountId membership.accountId}}"
                aria-current={{if (eq membership.accountId @accountId) "true"}}
              >
                {{membership.accountName}}
              </content.LinkItem>
            {{/each}}
          </menu.Content>
        </Menu>
      {{else}}
        <span class="single-account">{{this.current.accountName}}</span>
      {{/if}}
    </div>

    <style scoped>
      .account-switcher {
        padding: var(--padding-2) 0;
      }

      .trigger {
        width: 100%;
      }

      .single-account {
        display: block;
        padding: var(--padding-1) var(--padding-2);
        font-weight: 600;
      }
    </style>
  </template>
}
