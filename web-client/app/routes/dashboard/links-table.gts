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
import type { CellSignature, Row, TableColumn } from 'nvp.ui';

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

/**
 * What the action cells need beyond the row. It rides on the column
 * config, which a Cell reads through `@column.config`.
 */
interface ActionsConfig {
  onDelete?: (link: Link) => unknown;
  editing?: LinkEditing;
  isDeleting?: boolean;
}

function isEditing(link: Link, editing: LinkEditing | undefined) {
  return Boolean(editing) && link.id === editing?.id;
}

function actionsOf(column: { config: object }) {
  return column.config as ActionsConfig;
}

/**
 * Why Edit is disabled, which the button shows as its tooltip.
 */
function editDisabledReason(editing: LinkEditing, isDeleting: boolean | undefined) {
  if (editing.remaining === 0) return 'No link edits left on your plan this month';
  if (isDeleting) return 'Working...';

  return undefined;
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

const ShortLinkCell: TOC<CellSignature<Link>> = <template>
  <a href={{@row.data.shortUrl}} target="_blank" rel="noopener noreferrer">{{@row.data.shortUrl}}</a>
  <details class="link-details">
    <summary>Details</summary>
    <dl>
      <div class="link-details-row">
        <dt>Original URL</dt>
        <dd>
          <a
            href={{@row.data.original}}
            target="_blank"
            rel="noopener noreferrer"
          >{{@row.data.original}}</a>
        </dd>
      </div>
    </dl>
  </details>

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
  </style>
</template>;

const QrCell: TOC<CellSignature<Link>> = <template>
  <QrDisclosure @data={{@row.data.shortUrl}} @watermark={{watermarkOf @column}} />
</template>;

function watermarkOf(column: { config: object }) {
  return Boolean((column.config as { watermark?: boolean }).watermark);
}

const ActionsCell: TOC<CellSignature<Link>> = <template>
  {{#let (actionsOf @column) as |actions|}}
    {{#if actions.editing}}
      <Button
        class="edit-button"
        @disabled={{editDisabledReason actions.editing actions.isDeleting}}
        @onClick={{fn actions.editing.start @row.data}}
      >
        Edit
      </Button>
    {{/if}}
    {{#if actions.onDelete}}
      <Button
        class="delete-button"
        @variant="danger"
        @disabled={{if actions.isDeleting "Working..."}}
        @onClick={{fn actions.onDelete @row.data}}
      >
        Delete
      </Button>
    {{/if}}
  {{/let}}
</template>;

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

export class LinksTable extends Component<Signature> {
  /**
   * The columns carry what their cells need: the watermark flag for
   * the QR cell, the handlers for the actions cell.
   */
  get columns(): TableColumn<Link>[] {
    const columns: TableColumn<Link>[] = [
      { key: 'shortUrl', name: 'Short link', Cell: ShortLinkCell },
      { key: 'qr', name: 'QR code', Cell: QrCell, watermark: this.args.watermark },
      { key: 'visits', name: 'Visits', align: 'end' },
      { key: 'createdAt', name: 'Created', nowrap: true, value: createdOn },
      { key: 'expiresAt', name: 'Expires', nowrap: true, value: expiresOn },
    ];

    if (this.args.onDelete || this.args.editing) {
      columns.push({
        key: 'actions',
        name: 'Actions',
        align: 'end',
        Cell: ActionsCell,
        onDelete: this.args.onDelete,
        editing: this.args.editing,
        isDeleting: this.args.isDeleting,
      });
    }

    return columns;
  }

  isEditorFor = (row: Row<Link>) => isEditing(row.data, this.args.editing);

  <template>
    <Table @caption="Your links" @columns={{this.columns}} @data={{@links}} class="links-table">
      <:afterRow as |row count|>
        {{#if @editing}}
          {{#if (this.isEditorFor row)}}
            <tr class="editor-row">
              <td colspan={{count}}>
                <EditLinkForm
                  @link={{row.data}}
                  @canSetExpiration={{@editing.canSetExpiration}}
                  @isSaving={{if @isDeleting true false}}
                  @onSave={{fn @editing.save row.data}}
                  @onCancel={{@editing.cancel}}
                />
              </td>
            </tr>
          {{/if}}
        {{/if}}
      </:afterRow>

      <:empty>No links yet.</:empty>

      <:footer>{{yield to="footer"}}</:footer>
    </Table>

    <style scoped>
      .editor-row td {
        background: var(--color-page-background);
      }
    </style>
  </template>
}

function createdOn({ row }: { row: Row<Link> }) {
  return formatDate(row.data.createdAt);
}

function expiresOn({ row }: { row: Row<Link> }) {
  return formatDate(row.data.expiresAt);
}
