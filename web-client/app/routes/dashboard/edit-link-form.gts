import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

import { Button } from 'nvp.ui';

import type { Link } from '#app/data/types';

export interface LinkChanges {
  original?: string;
  expiresAt?: string | null;
}

/**
 * The date input works in whole days. An expiration set through it
 * means "through the end of that day, UTC".
 */
function toDateInputValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : '';
}

function toExpiresAt(dateInputValue: string) {
  return dateInputValue ? `${dateInputValue}T23:59:59.000Z` : null;
}

function field(data: FormData, name: string) {
  const value = data.get(name);

  return typeof value === 'string' ? value : '';
}

interface Signature {
  Args: {
    link: Link;
    canSetExpiration: boolean;
    isSaving: boolean;
    onSave: (changes: LinkChanges) => unknown;
    onCancel: () => unknown;
  };
}

export class EditLinkForm extends Component<Signature> {
  @tracked expiresValue = toDateInputValue(this.args.link.expiresAt);

  updateExpires = (event: Event) => {
    this.expiresValue = (event.target as HTMLInputElement).value;
  };

  clearExpires = () => {
    this.expiresValue = '';
  };

  submit = (event: SubmitEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const original = field(data, 'original').trim();
    const changes: LinkChanges = {};

    if (original && original !== this.args.link.original) {
      changes.original = original;
    }

    if (this.args.canSetExpiration) {
      const expiresAt = toExpiresAt(field(data, 'expiresAt'));

      if (expiresAt !== this.args.link.expiresAt) {
        changes.expiresAt = expiresAt;
      }
    }

    if (Object.keys(changes).length === 0) {
      this.args.onCancel();

      return;
    }

    this.args.onSave(changes);
  };

  <template>
    <form class="edit-link-form" {{on "submit" this.submit}}>
      <label>
        <span>Destination</span>
        <input name="original" type="url" required value={{@link.original}}>
      </label>

      {{#if @canSetExpiration}}
        <div class="expires-field">
          <label>
            <span>Expires</span>
            <input
              name="expiresAt"
              type="date"
              value={{this.expiresValue}}
              {{on "input" this.updateExpires}}
            >
          </label>
          {{#if this.expiresValue}}
            <Button type="button" @variant="bare" @onClick={{this.clearExpires}} data-test-clear-expires>
              Clear
            </Button>
          {{/if}}
        </div>
      {{/if}}

      <div class="edit-link-actions">
        <Button type="submit" @variant="primary" @disabled={{if @isSaving "Saving..."}}>
          Save
        </Button>
        <Button type="button" @variant="secondary" @onClick={{@onCancel}}>
          Cancel
        </Button>
      </div>
    </form>

    <style scoped>
      .edit-link-form {
        display: grid;
        gap: var(--gap-2);
        padding: var(--padding-2) 0;
      }

      .edit-link-form label {
        display: grid;
        gap: var(--gap-1);
      }

      .edit-link-form span {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.7;
      }

      .edit-link-form input {
        width: 100%;
        padding: 0.5rem 1rem;
        border-radius: var(--radius);
        border: var(--border-width) var(--border-style) var(--border-color);
        background: var(--color-page-background);
        color: var(--color-text);
      }

      .expires-field {
        display: flex;
        gap: var(--gap-2);
        align-items: end;
      }

      .expires-field label {
        flex: 1;
      }

      .edit-link-actions {
        display: flex;
        gap: var(--gap-2);
        align-items: center;
      }
    </style>
  </template>
}
