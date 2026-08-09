import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { service } from '@ember/service';

import { Button } from 'nvp.ui';

import type DashboardService from '#services/dashboard';

export default class Pricing extends Component {
  @service declare dashboard: DashboardService;

  <template>
    <main class="pricing-page">
      <section class="pricing-card surface">
        <h1>Pricing</h1>
        <p>Choose a plan for your monthly link allowance.</p>

        {{#if this.dashboard.billing.hasActiveSubscription}}
          <p>Your current plan is {{this.dashboard.billing.plan.name}}.</p>
          <Button @onClick={{this.dashboard.openBillingPortal}} @disabled={{if this.dashboard.isSubmitting "Opening billing portal..."}}>
            Manage subscription
          </Button>
        {{else}}
          <div class="plans">
            {{#each this.dashboard.billing.availablePlans as |plan|}}
              <article class="plan surface">
                <h2>{{plan.name}}</h2>
                <p>${{plan.priceInCents}}/month</p>
                <p>{{plan.monthlyLinkLimit}} links/month</p>
                <Button
                  @onClick={{fn this.dashboard.checkout plan.key}}
                  @disabled={{if this.dashboard.isSubmitting "Opening checkout..."}}
                >
                  Choose {{plan.name}}
                </Button>
              </article>
            {{/each}}
          </div>
        {{/if}}
      </section>
    </main>

    <style scoped>
      .pricing-page {
        min-height: calc(100dvh - 3.5rem);
        padding: 5rem 1rem 2rem;
        background: var(--color-page-background);
        color: var(--color-text);
      }

      .pricing-card {
        width: min(100%, 64rem);
        margin: 0 auto;
        padding: 2rem;
        border-radius: var(--radius);
        background: var(--surface-background-color);
      }

      .plans {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }

      .plan {
        display: grid;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: var(--radius);
        background: var(--surface-background-color);
      }

      .plan h2,
      .plan p {
        margin: 0;
      }

      @media (max-width: 700px) {
        .plans {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </template>
}
