import { formatDate, formatMoney } from '../../format.ts';

import type { TOC } from '@ember/component/template-only';
import type { BillingInvoice } from '#app/data/types';

const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  open: 'Open',
  draft: 'Draft',
  void: 'Void',
  uncollectible: 'Uncollectible',
};

function statusLabel(status: string | null) {
  if (!status) return '—';

  return STATUS_LABELS[status] ?? status;
}

function total(invoice: BillingInvoice) {
  return formatMoney(invoice.totalInCents, invoice.currency);
}

interface Signature {
  Args: {
    invoices: BillingInvoice[];
  };
}

export const InvoiceTable: TOC<Signature> = <template>
  {{#if @invoices.length}}
    <table class="invoice-table">
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Invoice</th>
          <th scope="col">Plan</th>
          <th scope="col">Period</th>
          <th scope="col">Total</th>
          <th scope="col">Status</th>
          <th scope="col"><span class="visually-hidden">Links</span></th>
        </tr>
      </thead>
      <tbody>
        {{#each @invoices as |invoice|}}
          <tr>
            <td>{{formatDate invoice.createdAt}}</td>
            <td>{{if invoice.number invoice.number "—"}}</td>
            <td>{{if invoice.planName invoice.planName "—"}}</td>
            <td class="period">
              {{formatDate invoice.periodStart}}
              –
              {{formatDate invoice.periodEnd}}
            </td>
            <td>{{total invoice}}</td>
            <td class="status-{{invoice.status}}">{{statusLabel invoice.status}}</td>
            <td class="links">
              {{#if invoice.hostedInvoiceUrl}}
                <a href={{invoice.hostedInvoiceUrl}} target="_blank" rel="noreferrer">View</a>
              {{/if}}
              {{#if invoice.invoicePdf}}
                <a href={{invoice.invoicePdf}}>PDF</a>
              {{/if}}
            </td>
          </tr>
        {{/each}}
      </tbody>
    </table>
  {{else}}
    <p class="muted">No invoices yet.</p>
  {{/if}}

  <style scoped>
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
    }

    .invoice-table th,
    .invoice-table td {
      padding: var(--padding-2) var(--padding-3);
      text-align: left;
      border-bottom: var(--border-width) var(--border-style) var(--border-color);
      vertical-align: top;
    }

    .invoice-table th {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
    }

    .invoice-table tbody tr:last-child td {
      border-bottom: none;
    }

    .period {
      white-space: nowrap;
    }

    .links {
      display: flex;
      gap: var(--gap-2);
    }

    .status-open,
    .status-uncollectible {
      color: var(--color-danger);
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    .muted {
      opacity: 0.7;
    }
  </style>
</template>;
