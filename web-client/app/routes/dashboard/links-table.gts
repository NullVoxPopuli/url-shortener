import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';

import { EditLinkForm } from './edit-link-form.gts';
import { formatDate } from './format';
import { QrCode } from './qr-code.gts';

import type { LinkChanges } from './edit-link-form.gts';
import type { TOC } from '@ember/component/template-only';
import type { Link } from '#app/data/types';

/**
 * Everything the table needs to offer editing. The owner holds the
 * editing state, so a save can close the editor after its refresh.
 */
export interface LinkEditing {
  /** the link whose editor is open */
  id: string | null;
  /** null = unlimited. 0 disables the Edit button. */
  remaining: number | null;
  canSetExpiration: boolean;
  start: (link: Link) => unknown;
  cancel: () => unknown;
  save: (link: Link, changes: LinkChanges) => unknown;
}

function isEditing(link: Link, editing: LinkEditing | undefined) {
  return Boolean(editing) && link.id === editing?.id;
}

/**
 * The Actions column spans one more cell than the data columns when
 * it is shown, so the editor row can stretch under the whole table.
 */
function columnCount(hasActions: boolean) {
  return hasActions ? 6 : 5;
}

interface QrDisclosureSignature {
  Args: {
    data: string;
    watermark: boolean;
  };
}

/**
 * The QR svg is only rendered (and thus only generated) once the
 * disclosure is first opened.
 */
class QrDisclosure extends Component<QrDisclosureSignature> {
  @tracked isOpen = false;

  onToggle = (event: Event) => {
    this.isOpen = (event.currentTarget as HTMLDetailsElement).open;
  };

  <template>
    <details class="qr-details" {{on "toggle" this.onToggle}}>
      <summary>View</summary>
      {{#if this.isOpen}}
        <QrCode @data={{@data}} @watermark={{@watermark}} />
      {{/if}}
    </details>

    <style scoped>
      .qr-details summary {
        cursor: pointer;
      }

      .qr-details[open] {
        padding-bottom: var(--padding-2);
      }
    </style>
  </template>
}

interface Signature {
  Args: {
    links: Link[];
    watermark: boolean;
    /**
     * When provided, an Actions column with a Delete button appears
     * (the link-management page passes this; the overview does not).
     */
    onDelete?: (link: Link) => unknown;
    isDeleting?: boolean;
    /**
     * When provided, an Edit button appears (the link-management page
     * passes this; the overview does not).
     */
    editing?: LinkEditing;
  };
}

function hasActions(onDelete: unknown, editing: unknown) {
  return Boolean(onDelete || editing);
}

function cannotEdit(editing: LinkEditing) {
  return editing.remaining === 0;
}

export const LinksTable: TOC<Signature> = <template>
  {{#if @links.length}}
    <table class="links-table">
      <thead>
        <tr>
          <th scope="col">Short link</th>
          <th scope="col">QR code</th>
          <th scope="col">Visits</th>
          <th scope="col">Created</th>
          <th scope="col">Expires</th>
          {{#if (hasActions @onDelete @editing)}}
            <th scope="col">Actions</th>
          {{/if}}
        </tr>
      </thead>
      <tbody>
        {{#each @links as |link|}}
          <tr>
            <td>
              <a
                href={{link.shortUrl}}
                target="_blank"
                rel="noopener noreferrer"
              >{{link.shortUrl}}</a>
              <details class="link-details">
                <summary>Details</summary>
                <dl>
                  <div class="link-details-row">
                    <dt>Original URL</dt>
                    <dd>
                      <a
                        href={{link.original}}
                        target="_blank"
                        rel="noopener noreferrer"
                      >{{link.original}}</a>
                    </dd>
                  </div>
                </dl>
              </details>
            </td>
            <td>
              <QrDisclosure @data={{link.shortUrl}} @watermark={{@watermark}} />
            </td>
            <td>{{link.visits}}</td>
            <td>{{formatDate link.createdAt}}</td>
            <td>{{formatDate link.expiresAt}}</td>
            {{#if (hasActions @onDelete @editing)}}
              <td class="actions">
                {{#if @editing}}
                  <button
                    type="button"
                    class="edit-button"
                    disabled={{if (cannotEdit @editing) true @isDeleting}}
                    title={{if
                      (cannotEdit @editing)
                      "No link edits left on your plan this month"
                    }}
                    {{on "click" (fn @editing.start link)}}
                  >
                    Edit
                  </button>
                {{/if}}
                {{#if @onDelete}}
                  <button
                    type="button"
                    class="delete-button"
                    disabled={{@isDeleting}}
                    {{on "click" (fn @onDelete link)}}
                  >
                    Delete
                  </button>
                {{/if}}
              </td>
            {{/if}}
          </tr>
          {{#if @editing}}
            {{#if (isEditing link @editing)}}
              <tr class="editor-row">
                <td colspan={{columnCount (hasActions @onDelete @editing)}}>
                  <EditLinkForm
                    @link={{link}}
                    @canSetExpiration={{@editing.canSetExpiration}}
                    @isSaving={{if @isDeleting true false}}
                    @onSave={{fn @editing.save link}}
                    @onCancel={{@editing.cancel}}
                  />
                </td>
              </tr>
            {{/if}}
          {{/if}}
        {{/each}}
      </tbody>
    </table>
  {{else}}
    <p class="muted">No links yet.</p>
  {{/if}}

  <style scoped>
    .muted {
      opacity: 0.7;
    }

    .links-table {
      width: 100%;
      border-collapse: collapse;
    }

    .links-table th,
    .links-table td {
      padding: var(--padding-2) var(--padding-3);
      text-align: left;
      border-bottom: var(--border-width) var(--border-style)
        var(--border-color);
    }

    .links-table th {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
    }

    .links-table tbody tr:last-child td {
      border-bottom: none;
    }

    .actions {
      white-space: nowrap;
    }

    .edit-button {
      color: var(--color-text);
      background: none;
      border: var(--border-width) var(--border-style) var(--border-color);
      border-radius: var(--radius);
      padding: var(--padding-1) var(--padding-2);
      cursor: pointer;
      margin-right: var(--gap-1);
    }

    .edit-button:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .editor-row td {
      background: var(--color-page-background);
    }

    .delete-button {
      color: var(--color-danger);
      background: none;
      border: var(--border-width) var(--border-style) var(--border-color);
      border-radius: var(--radius);
      padding: var(--padding-1) var(--padding-2);
      cursor: pointer;
    }

    .delete-button:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .link-details {
      margin-top: var(--gap-1);
      font-size: 0.85rem;
    }

    .link-details summary {
      cursor: pointer;
      opacity: 0.7;
    }

    .link-details dl {
      margin: var(--gap-2) 0 0;
      display: grid;
      gap: var(--gap-2);
    }

    .link-details-row {
      display: grid;
      gap: var(--gap-1);
    }

    .link-details dt {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
    }

    .link-details dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
  </style>
</template>;
