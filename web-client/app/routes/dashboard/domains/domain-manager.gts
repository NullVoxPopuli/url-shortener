import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';

import { Request } from '@warp-drive/ember';
import { Button } from 'nvp.ui';

import { messageFrom } from '#app/data/errors';
import { createDomain, deleteDomain } from '#app/data/requests';

import { formatDate } from '../format';

import type { Store } from '@warp-drive/core';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { CustomDomain } from '#app/data/types';

interface Signature {
  Args: {
    accountId: string;
    isAdmin: boolean;
    domains: Future<ReactiveDataDocument<CustomDomain[]>>;
  };
}

export default class DomainManager extends Component<Signature> {
  @service declare store: Store;

  @tracked isWorking = false;
  @tracked error: string | null = null;

  add = async (refresh: () => Promise<void>, event: SubmitEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const value = new FormData(form).get('hostname');
    const hostname = typeof value === 'string' ? value.trim() : '';

    if (!hostname) return;

    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(createDomain(hostname, this.args.accountId));
      await refresh();
      form.reset();
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  remove = async (refresh: () => Promise<void>, domain: CustomDomain) => {
    if (!window.confirm(`Remove ${domain.hostname}? Links on it will stop resolving.`)) {
      return;
    }

    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(deleteDomain(domain.id, this.args.accountId));
      await refresh();
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  <template>
    <div class="page-shell">
      <h1>Domains</h1>

      <section class="page-card surface">
        <h2>Custom domains</h2>

        <Request @request={{@domains}}>
          <:loading>
            <p class="muted">Loading domains…</p>
          </:loading>

          <:error>
            <p class="warning">Could not load domains. Refresh to try again.</p>
          </:error>

          <:content as |doc state|>
            {{#if doc.data.length}}
              <table class="domain-table">
                <thead>
                  <tr>
                    <th scope="col">Hostname</th>
                    <th scope="col">Added</th>
                    {{#if @isAdmin}}
                      <th scope="col">Actions</th>
                    {{/if}}
                  </tr>
                </thead>
                <tbody>
                  {{#each doc.data as |domain|}}
                    <tr>
                      <td><code>{{domain.hostname}}</code></td>
                      <td>{{formatDate domain.createdAt}}</td>
                      {{#if @isAdmin}}
                        <td>
                          <button
                            type="button"
                            class="danger-button"
                            disabled={{this.isWorking}}
                            {{on "click" (fn this.remove state.refresh domain)}}
                          >
                            Remove
                          </button>
                        </td>
                      {{/if}}
                    </tr>
                  {{/each}}
                </tbody>
              </table>
            {{else}}
              <p class="muted">No custom domains yet. Point a hostname's DNS at
                nvp.gg, then add it here to shorten links on your own domain.</p>
            {{/if}}

            {{#if @isAdmin}}
              <form class="add-form" {{on "submit" (fn this.add state.refresh)}}>
                <label>
                  <span class="visually-hidden">Hostname</span>
                  <input name="hostname" placeholder="links.example.com" required>
                </label>
                <Button
                  type="submit"
                  @variant="primary"
                  @disabled={{if this.isWorking "Working..."}}
                >
                  Add domain
                </Button>
              </form>
            {{/if}}

            {{#if this.error}}
              <p class="warning">{{this.error}}</p>
            {{/if}}
          </:content>
        </Request>
      </section>
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

      .domain-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: var(--gap-3);
      }

      .domain-table th,
      .domain-table td {
        padding: var(--padding-2) var(--padding-3);
        text-align: left;
        border-bottom: var(--border-width) var(--border-style)
          var(--border-color);
      }

      .domain-table th {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.7;
      }

      .domain-table tbody tr:last-child td {
        border-bottom: none;
      }

      .add-form {
        display: flex;
        gap: var(--gap-2);
        margin-top: var(--gap-3);
      }

      .add-form label {
        flex: 1;
      }

      .add-form input {
        width: 100%;
        padding: 0.5rem 1rem;
        border-radius: var(--radius);
        border: var(--border-width) var(--border-style) var(--border-color);
        background: var(--color-page-background);
        color: var(--color-text);
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

      .muted {
        opacity: 0.7;
      }

      .warning {
        color: var(--color-danger);
      }
    </style>
  </template>
}
