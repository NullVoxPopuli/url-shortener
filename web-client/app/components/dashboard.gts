import Component from '@glimmer/component';
import { service } from '@ember/service';

import type DashboardService from '#services/dashboard';

export default class Dashboard extends Component {
  @service declare dashboard: DashboardService;

  <template>
  <main class="dashboard-page">
    <section class="dashboard-card surface">
      <h1>Dashboard</h1>

      <div class="dashboard-grid">
        <section>
          <h2>Subscription</h2>
          {{#if this.dashboard.isFree}}
            <p>Free account</p>
          {{else if this.dashboard.hasNoSubscription}}
            <p>No subscription</p>
          {{else}}
            <p>{{this.dashboard.billing.plan.name}}</p>
            <p>{{this.dashboard.billing.plan.monthlyLinkLimit}} links per month</p>
            <p>
              Current period:
              {{this.dashboard.billing.stripe.currentPeriodStart}}
              to
              {{this.dashboard.billing.stripe.currentPeriodEnd}}
            </p>
            {{#if this.dashboard.billing.stripe.cancelAtPeriodEnd}}
              <p>Cancellation scheduled at the end of the current period.</p>
            {{/if}}
          {{/if}}
        </section>

        <section>
          <h2>Links</h2>
          <p>{{this.dashboard.billing.usage.used}} of {{this.dashboard.billing.plan.monthlyLinkLimit}} links used this month</p>
          {{#if this.dashboard.billing.usage.remaining}}
            <p>{{this.dashboard.billing.usage.remaining}} links remaining this month</p>
          {{else}}
            <p>Unlimited links</p>
          {{/if}}
        </section>
      </div>
      <a href="/pricing">View pricing and plans</a>
    </section>
  </main>

  <style scoped>
    .dashboard-page {
      min-height: calc(100dvh - 3.5rem);
      padding: 5rem 1rem 2rem;
      background: var(--color-page-background);
      color: var(--color-text);
    }

    .dashboard-card {
      width: min(100%, 56rem);
      margin: 0 auto;
      padding: 2rem;
      border-radius: var(--radius);
      background: var(--surface-background-color);
    }

    .dashboard-card h1,
    .dashboard-card h2,
    .dashboard-card p {
      margin-top: 0;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 2rem;
    }

    @media (max-width: 600px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</template>
}
