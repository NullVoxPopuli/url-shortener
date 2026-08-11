import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';

import { formatDate } from '../format';

import type { ApiKey } from '#app/data/types';

function scopeList(key: ApiKey) {
  return key.scopes.join(', ');
}

function isExpired(key: ApiKey) {
  return Boolean(key.expiresAt && new Date(key.expiresAt).getTime() < Date.now());
}

interface Signature {
  Args: {
    keys: ApiKey[];
    isWorking?: boolean;
    onRevoke: (key: ApiKey) => unknown;
  };
}

export default class ApiKeyTable extends Component<Signature> {
  <template>
    {{#if @keys.length}}
      <table class="key-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Scopes</th>
            <th scope="col">Created</th>
            <th scope="col">Last used</th>
            <th scope="col">Expires</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {{#each @keys as |key|}}
            <tr>
              <td>{{key.name}}</td>
              <td><code>{{scopeList key}}</code></td>
              <td>{{formatDate key.createdAt}}</td>
              <td>
                {{#if key.lastUsedAt}}
                  {{formatDate key.lastUsedAt}}
                {{else}}
                  <span class="muted">Never</span>
                {{/if}}
              </td>
              <td>
                {{#if key.expiresAt}}
                  {{#if (isExpired key)}}
                    <span class="warning">Expired {{formatDate key.expiresAt}}</span>
                  {{else}}
                    {{formatDate key.expiresAt}}
                  {{/if}}
                {{else}}
                  <span class="muted">Never</span>
                {{/if}}
              </td>
              <td>
                <button
                  type="button"
                  class="danger-button"
                  disabled={{@isWorking}}
                  {{on "click" (fn @onRevoke key)}}
                >
                  Revoke
                </button>
              </td>
            </tr>
          {{/each}}
        </tbody>
      </table>
    {{else}}
      <p class="muted">No API keys yet. Create one to use the links API from scripts, CI, or
        other tools — see the API documentation for the endpoints.</p>
    {{/if}}

    <style scoped>
      .key-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: var(--gap-3);
      }

      .key-table th,
      .key-table td {
        padding: var(--padding-2) var(--padding-3);
        text-align: left;
        border-bottom: var(--border-width) var(--border-style)
          var(--border-color);
      }

      .key-table th {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.7;
      }

      .key-table tbody tr:last-child td {
        border-bottom: none;
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
