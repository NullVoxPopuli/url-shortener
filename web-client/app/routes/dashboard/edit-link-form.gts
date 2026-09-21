import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';
import { on } from '@ember/modifier';

import { checkout } from '@warp-drive/core/reactive';
import { dataFromEvent } from 'ember-primitives/components/form';
import { Button } from 'nvp.ui';
import { getPromiseState } from 'reactiveweb/get-promise-state';

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

/**
 * The form data utility hands a date input back as a Date (UTC
 * midnight of that day) or, when empty, nothing.
 */
function toExpiresAt(value: unknown) {
  if (value instanceof Date) return `${value.toISOString().slice(0, 10)}T23:59:59.000Z`;
  if (typeof value === 'string' && value) return `${value}T23:59:59.000Z`;

  return null;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}


/**
 * The fields on the editable copy that differ from the saved record.
 */
export function changesBetween(saved: Link, editable: Link): LinkChanges {
  const changes: LinkChanges = {};

  if (editable.original !== saved.original) changes.original = editable.original;
  if (editable.expiresAt !== saved.expiresAt) changes.expiresAt = editable.expiresAt;

  return changes;
}

interface Signature {
  Args: {
    /**
     * The immutable record from the store. The form edits a checked-out
     * copy; the save response updates the cache, which commits the copy.
     */
    link: Link;
    canSetExpiration: boolean;
    isSaving: boolean;
    onSave: (changes: LinkChanges) => unknown;
    onCancel: () => unknown;
  };
}

export class EditLinkForm extends Component<Signature> {
  @cached
  get checkout() {
    return checkout<Link>(this.args.link);
  }

  get state() {
    return getPromiseState(this.checkout);
  }

  get editable() {
    return this.state.resolved ?? null;
  }

  get expiresValue() {
    return toDateInputValue(this.editable?.expiresAt ?? null);
  }

  clearExpires = (event: Event) => {
    const form = (event.currentTarget as HTMLElement).closest('form');
    const input = form?.elements.namedItem('expiresAt');

    if (input instanceof HTMLInputElement) input.value = '';
  };

  /**
   * The form's values land on the editable copy only on submit.
   */
  submit = (event: SubmitEvent) => {
    event.preventDefault();

    if (!this.editable) return;

    const data = dataFromEvent(event);

    this.editable.original = text(data.original);

    if (this.args.canSetExpiration) {
      this.editable.expiresAt = toExpiresAt(data.expiresAt);
    }

    const changes = changesBetween(this.args.link, this.editable);

    if (Object.keys(changes).length === 0) {
      this.args.onCancel();

      return;
    }

    this.args.onSave(changes);
  };

  <template>
    {{#if this.editable}}
      <form class="edit-link-form" {{on "submit" this.submit}}>
        <label>
          <span>Destination</span>
          <input name="original" type="url" required value={{this.editable.original}}>
        </label>

        {{#if @canSetExpiration}}
          <div class="expires-field">
            <label>
              <span>Expires</span>
              <input name="expiresAt" type="date" value={{this.expiresValue}}>
            </label>
                          <Button
                type="button"
                @variant="bare"
                @onClick={{this.clearExpires}}
                data-test-clear-expires
              >
                Clear
              </Button>
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
    {{else if this.state.error}}
      <p class="warning">Could not open this link for editing.</p>
    {{/if}}

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

      .warning {
        color: var(--color-danger);
      }
    </style>
  </template>
}
