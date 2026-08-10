import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';

import { Request } from '@warp-drive/ember';
import { Button } from 'nvp.ui';

import { messageFrom } from '#app/data/errors';
import {
  createInvitation,
  removeMembership,
  revokeInvitation,
} from '#app/data/requests';

import { formatDate } from '../format';

import type { Store } from '@warp-drive/core';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { Invitation, Membership } from '#app/data/types';
import type CurrentUserService from '#services/current-user';

interface Signature {
  Args: {
    accountId: string;
    isAdmin: boolean;
    memberships: Future<ReactiveDataDocument<Membership[]>>;
    invitations: Future<ReactiveDataDocument<Invitation[]>> | null;
  };
}

export default class TeamManager extends Component<Signature> {
  @service declare store: Store;
  @service declare currentUser: CurrentUserService;

  @tracked isWorking = false;
  @tracked error: string | null = null;

  invite = async (refresh: () => Promise<void>) => {
    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(createInvitation(this.args.accountId));
      await refresh();
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  revoke = async (refresh: () => Promise<void>, invitation: Invitation) => {
    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(revokeInvitation(invitation.id));
      await refresh();
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  remove = async (refresh: () => Promise<void>, membership: Membership) => {
    const name = membership.user?.name ?? 'this member';

    if (!window.confirm(`Remove ${name} from the account?`)) return;

    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(removeMembership(membership.id));
      await refresh();
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  copy = (invitation: Invitation) => {
    void navigator.clipboard.writeText(invitation.acceptUrl);
  };

  <template>
    <div class="page-shell">
      <h1>Users</h1>

      <section class="page-card surface">
        <h2>Members</h2>

        <Request @request={{@memberships}}>
          <:loading>
            <p class="muted">Loading members…</p>
          </:loading>

          <:error>
            <p class="warning">Could not load members. Refresh to try again.</p>
          </:error>

          <:content as |doc state|>
            <table class="team-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Joined</th>
                  {{#if @isAdmin}}
                    <th scope="col">Actions</th>
                  {{/if}}
                </tr>
              </thead>
              <tbody>
                {{#each doc.data as |membership|}}
                  <tr>
                    <td>{{membership.user.name}}</td>
                    <td>{{membership.role}}</td>
                    <td>{{formatDate membership.createdAt}}</td>
                    {{#if @isAdmin}}
                      <td>
                        {{#if (isRemovable membership)}}
                          <button
                            type="button"
                            class="danger-button"
                            disabled={{this.isWorking}}
                            {{on "click" (fn this.remove state.refresh membership)}}
                          >
                            Remove
                          </button>
                        {{/if}}
                      </td>
                    {{/if}}
                  </tr>
                {{/each}}
              </tbody>
            </table>
          </:content>
        </Request>
      </section>

      {{#if @invitations}}
        <section class="page-card surface">
          <h2>Invitations</h2>

          <Request @request={{@invitations}}>
            <:loading>
              <p class="muted">Loading invitations…</p>
            </:loading>

            <:error>
              <p class="warning">Could not load invitations. Refresh to try
                again.</p>
            </:error>

            <:content as |doc state|>
              {{#if doc.data.length}}
                <ul class="invitation-list">
                  {{#each doc.data as |invitation|}}
                    <li class="invitation">
                      <code class="invitation-url">{{invitation.acceptUrl}}</code>
                      <span class="muted">expires
                        {{formatDate invitation.expiresAt}}</span>
                      <span class="invitation-actions">
                        <Button @onClick={{fn this.copy invitation}}>
                          Copy link
                        </Button>
                        <button
                          type="button"
                          class="danger-button"
                          disabled={{this.isWorking}}
                          {{on "click" (fn this.revoke state.refresh invitation)}}
                        >
                          Revoke
                        </button>
                      </span>
                    </li>
                  {{/each}}
                </ul>
              {{else}}
                <p class="muted">No pending invitations. Invite a teammate with
                  a shareable link.</p>
              {{/if}}

              <div class="invite-actions">
                <Button
                  @variant="primary"
                  @onClick={{fn this.invite state.refresh}}
                  @disabled={{if this.isWorking "Working..."}}
                >
                  New invitation link
                </Button>
              </div>

              {{#if this.error}}
                <p class="warning">{{this.error}}</p>
              {{/if}}
            </:content>
          </Request>
        </section>
      {{/if}}
    </div>

    <style scoped>
      .page-shell {
        width: min(100%, 56rem);
        margin: 0 auto;
        display: grid;
        gap: var(--gap-4);
      }

      .page-shell h1 {
        margin: 0;
      }

      .page-card {
        margin: 0;
        padding: var(--padding-4) 1.5rem;
        border: var(--border-width) var(--border-style) var(--border-color);
        border-radius: var(--radius);
        background: var(--surface-background-color);
      }

      .page-card h2 {
        margin: 0 0 var(--gap-3);
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.7;
      }

      .team-table {
        width: 100%;
        border-collapse: collapse;
      }

      .team-table th,
      .team-table td {
        padding: var(--padding-2) var(--padding-3);
        text-align: left;
        border-bottom: var(--border-width) var(--border-style)
          var(--border-color);
      }

      .team-table th {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.7;
      }

      .team-table tbody tr:last-child td {
        border-bottom: none;
      }

      .invitation-list {
        list-style: none;
        margin: 0 0 var(--gap-3);
        padding: 0;
        display: grid;
        gap: var(--gap-3);
      }

      .invitation {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--gap-2);
      }

      .invitation-url {
        overflow-wrap: anywhere;
      }

      .invitation-actions {
        display: inline-flex;
        gap: var(--gap-2);
      }

      .danger-button {
        color: var(--color-danger);
        background: none;
        border: var(--border-width) var(--border-style) var(--border-color);
        border-radius: var(--radius);
        padding: var(--padding-1) var(--padding-2);
        cursor: pointer;
      }

      .danger-button:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .invite-actions {
        margin-top: var(--gap-2);
      }

      .muted {
        opacity: 0.7;
      }

      .warning {
        color: var(--color-danger);
      }
    </style>
  </template>
}

/**
 * Admin memberships (the owner) cannot be removed.
 */
function isRemovable(membership: Membership) {
  return membership.role !== 'admin';
}
