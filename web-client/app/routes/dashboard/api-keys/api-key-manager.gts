import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';

import { Request } from '@warp-drive/ember';
import { Button } from 'nvp.ui';

import { messageFrom } from '#app/data/errors';
import { createApiKey, revokeApiKey } from '#app/data/requests';

import ApiKeyTable from './api-key-table';
import NewApiKey from './new-api-key';

import type { Store } from '@warp-drive/core';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { ApiKey, ApiKeyQuota } from '#app/data/types';

interface Signature {
  Args: {
    accountId: string;
    apiKeys: Future<ReactiveDataDocument<ApiKey[]>>;
  };
}

export default class ApiKeyManager extends Component<Signature> {
  @service declare store: Store;

  @tracked isWorking = false;
  @tracked error: string | null = null;
  @tracked newKey: { name: string; token: string } | null = null;

  quotaOf = (doc: ReactiveDataDocument<ApiKey[]>) => {
    return (doc.meta ?? {}) as Partial<ApiKeyQuota>;
  };

  create = async (refresh: () => Promise<void>, event: SubmitEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const scopes = data.getAll('scopes').map(String);
    const expires = String(data.get('expiresInDays') ?? '');

    if (!name || scopes.length === 0) {
      this.error = 'A name and at least one scope are required.';
      return;
    }

    this.isWorking = true;
    this.error = null;

    try {
      const result = await this.store.request(
        createApiKey(
          { name, scopes, ...(expires ? { expiresInDays: Number(expires) } : {}) },
          this.args.accountId
        )
      );

      const created = result.content.data;

      this.newKey = created?.token ? { name: created.name, token: created.token } : null;

      await refresh();
      form.reset();
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  revoke = async (refresh: () => Promise<void>, key: ApiKey) => {
    if (!window.confirm(`Revoke "${key.name}"? Anything using it stops working immediately.`)) {
      return;
    }

    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(revokeApiKey(key.id, this.args.accountId));

      if (this.newKey?.name === key.name) {
        this.newKey = null;
      }

      await refresh();
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  <template>
    <div class="page-shell">
      <h1>API Keys</h1>

      <section class="page-card surface">
        <h2>Your keys</h2>

        <Request @request={{@apiKeys}}>
          <:loading>
            <p class="muted">Loading API keys…</p>
          </:loading>

          <:error>
            <p class="warning">Could not load API keys. Refresh to try again.</p>
          </:error>

          <:content as |doc state|>
            {{#if this.newKey}}
              <NewApiKey @name={{this.newKey.name}} @token={{this.newKey.token}} />
            {{/if}}

            <ApiKeyTable
              @keys={{doc.data}}
              @isWorking={{this.isWorking}}
              @onRevoke={{fn this.revoke state.refresh}}
            />

            {{#let (this.quotaOf doc) as |quota|}}
              {{#if quota.limit}}
                <p class="muted">{{quota.used}} of {{quota.limit}} keys in use — the limit comes
                  from the account's plan.</p>
              {{/if}}

              <form class="add-form" {{on "submit" (fn this.create state.refresh)}}>
                <label class="name-field">
                  <span>Name</span>
                  <input name="name" placeholder="CI deploys" required>
                </label>

                <fieldset class="scopes">
                  <legend>Scopes</legend>
                  <label><input type="checkbox" name="scopes" value="links:read" checked>
                    links:read — list links and their visits</label>
                  <label><input type="checkbox" name="scopes" value="links:write">
                    links:write — create and delete links</label>
                </fieldset>

                <label class="expires-field">
                  <span>Expires</span>
                  <select name="expiresInDays">
                    <option value="">Never</option>
                    <option value="30">In 30 days</option>
                    <option value="90">In 90 days</option>
                    <option value="365">In 1 year</option>
                  </select>
                </label>

                <Button
                  type="submit"
                  @variant="primary"
                  @disabled={{if this.isWorking "Working..."}}
                >
                  Create API key
                </Button>
              </form>
            {{/let}}

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

      .add-form {
        display: grid;
        gap: var(--gap-3);
        margin-top: var(--gap-3);
        justify-items: start;
      }

      .name-field,
      .expires-field {
        display: grid;
        gap: var(--gap-1);
      }

      .name-field input,
      .expires-field select {
        padding: 0.5rem 1rem;
        border-radius: var(--radius);
        border: var(--border-width) var(--border-style) var(--border-color);
        background: var(--color-page-background);
        color: var(--color-text);
        min-width: 16rem;
      }

      .scopes {
        display: grid;
        gap: var(--gap-1);
        border: var(--border-width) var(--border-style) var(--border-color);
        border-radius: var(--radius);
        padding: var(--padding-2) var(--padding-3);
      }

      .scopes label {
        display: flex;
        gap: var(--gap-2);
        align-items: baseline;
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
