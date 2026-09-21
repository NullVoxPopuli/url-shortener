import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';

import { Button } from 'nvp.ui';
import { Table } from 'nvp.ui/table';

import { EditLinkForm } from './edit-link-form.gts';
import { formatDate } from './format';
import { QrCode } from './qr-code.gts';

import type { TOC } from '@ember/component/template-only';
import type { Link } from '#app/data/types';

/**
 * Everything the table needs to offer editing. The owner holds the
 * editing state, so a save can close the editor.
 */
export interface LinkEditing {
  /** the link whose editor is open */
  id: string | null;
  /** null = unlimited. 0 disables the Edit button. */
  remaining: number | null;
  canSetExpiration: boolean;
  start: (link: Link) => unknown;
  cancel: () => unknown;
  save: (link: Link, editable: Link) => unknown;
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

function isEmpty(links: Link[]) {
  return links.length === 0;
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
  Blocks: {
    /**
     * Below the table: pagination.
     */
    footer: [];
  };
}

function hasActions(onDelete: unknown, editing: unknown) {
  return Boolean(onDelete || editing);
}

/**
 * Why Edit is disabled, which the button shows as its tooltip.
 */
function editDisabledReason(editing: LinkEditing, isDeleting: boolean | undefined) {
  if (editing.remaining === 0) return 'No link edits left on your plan this month';
  if (isDeleting) return 'Working...';

  return undefined;
}

export const LinksTable: TOC<Signature> = <template>
  <Table @caption="Your links" @isEmpty={{isEmpty @links}} class="links-table">
    <:head as |h|>
      <h.Cell>Short link</h.Cell>
      <h.Cell>QR code</h.Cell>
      <h.Cell @align="end">Visits</h.Cell>
      <h.Cell>Created</h.Cell>
      <h.Cell>Expires</h.Cell>
      {{#if (hasActions @onDelete @editing)}}
        <h.Cell @align="end">Actions</h.Cell>
      {{/if}}
    </:head>

    <:body as |b|>
      {{#each @links as |link|}}
        <b.Row as |r|>
          <r.Cell>
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
          </r.Cell>
          <r.Cell>
            <QrDisclosure @data={{link.shortUrl}} @watermark={{@watermark}} />
          </r.Cell>
          <r.Cell @align="end">{{link.visits}}</r.Cell>
          <r.Cell @nowrap={{true}}>{{formatDate link.createdAt}}</r.Cell>
          <r.Cell @nowrap={{true}}>{{formatDate link.expiresAt}}</r.Cell>
          {{#if (hasActions @onDelete @editing)}}
            <r.Actions>
              {{#if @editing}}
                <Button
                  class="edit-button"
                  @disabled={{editDisabledReason @editing @isDeleting}}
                  @onClick={{fn @editing.start link}}
                >
                  Edit
                </Button>
              {{/if}}
              {{#if @onDelete}}
                <Button
                  class="delete-button"
                  @variant="danger"
                  @disabled={{if @isDeleting "Working..."}}
                  @onClick={{fn @onDelete link}}
                >
                  Delete
                </Button>
              {{/if}}
            </r.Actions>
          {{/if}}
        </b.Row>
        {{#if @editing}}
          {{#if (isEditing link @editing)}}
            <b.Row class="editor-row" as |r|>
              <r.Cell colspan={{columnCount (hasActions @onDelete @editing)}}>
                <EditLinkForm
                  @link={{link}}
                  @canSetExpiration={{@editing.canSetExpiration}}
                  @isSaving={{if @isDeleting true false}}
                  @onSave={{fn @editing.save link}}
                  @onCancel={{@editing.cancel}}
                />
              </r.Cell>
            </b.Row>
          {{/if}}
        {{/if}}
      {{/each}}
    </:body>

    <:empty>No links yet.</:empty>

    <:footer>{{yield to="footer"}}</:footer>
  </Table>

  <style scoped>
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

    .editor-row td {
      background: var(--color-page-background);
    }
  </style>
</template>;
