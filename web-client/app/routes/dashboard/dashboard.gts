import { Request } from '@warp-drive/ember';

import { LinksTable } from './links-table';
import { SubscriptionCard } from './subscription-card';
import { UsageCard } from './usage-card';

import type { TOC } from '@ember/component/template-only';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { BillingStatus, Link } from '#app/data/types';

interface Signature {
  Args: {
    billing: Future<ReactiveDataDocument<BillingStatus>>;
    links: Future<ReactiveDataDocument<Link[]>>;
  };
}

const Dashboard: TOC<Signature> = <template>
  <main class="dashboard-page">
    <div class="dashboard-shell">
      <h1>Dashboard</h1>

      <Request @request={{@billing}}>
        <:loading>
          <p class="muted">Loading your subscription…</p>
        </:loading>

        <:error>
          <p class="warning">Could not load your billing status. Refresh to try
            again.</p>
        </:error>

        <:content as |doc|>
          <div class="dashboard-grid">
            <SubscriptionCard @billing={{doc.data}} />
            <UsageCard @billing={{doc.data}} />
          </div>
        </:content>
      </Request>

      <section class="dashboard-card surface">
        <h2>Your links</h2>

        <Request @request={{@links}}>
          <:loading>
            <p class="muted">Loading your links…</p>
          </:loading>

          <:error>
            <p class="warning">Could not load your links. Refresh to try
              again.</p>
          </:error>

          <:content as |doc|>
            <LinksTable @links={{doc.data}} />
          </:content>
        </Request>
      </section>
    </div>
  </main>

  <style scoped>
    .dashboard-page {
      min-height: calc(100dvh - 3.5rem);
      padding: 5rem 1rem 2rem;
      background: var(--color-page-background);
      color: var(--color-text);
    }

    .dashboard-shell {
      width: min(100%, 56rem);
      margin: 0 auto;
      display: grid;
      gap: var(--gap-4);
    }

    .dashboard-shell h1 {
      margin: 0;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--gap-4);
    }

    @media (max-width: 600px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    .dashboard-card {
      margin: 0;
      padding: var(--padding-4) 1.5rem;
      border: var(--border-width) var(--border-style) var(--border-color);
      border-radius: var(--radius);
      background: var(--surface-background-color);
    }

    .dashboard-card h2 {
      margin: 0 0 var(--gap-3);
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
    }

    .muted {
      opacity: 0.7;
    }

    .warning {
      color: var(--color-danger);
    }
  </style>
</template>;

export default Dashboard;
