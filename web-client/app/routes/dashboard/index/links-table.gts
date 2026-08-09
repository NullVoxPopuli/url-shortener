import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

import { formatDate } from './format';
import { QrCode } from './qr-code';

import type { TOC } from '@ember/component/template-only';
import type { Link } from '#app/data/types';

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
  };
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
            </td>
            <td>
              <QrDisclosure @data={{link.shortUrl}} @watermark={{@watermark}} />
            </td>
            <td>{{link.visits}}</td>
            <td>{{formatDate link.createdAt}}</td>
            <td>{{formatDate link.expiresAt}}</td>
          </tr>
        {{/each}}
      </tbody>
    </table>
  {{else}}
    <p class="muted">No links yet. Create one from the home page.</p>
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
  </style>
</template>;
