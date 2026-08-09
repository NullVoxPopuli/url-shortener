import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';

import { Request } from '@warp-drive/ember';
import { Button } from 'nvp.ui';

import { openBillingPortal, startCheckout } from '#app/data/billing';

import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { BillingStatus } from '#app/data/types';

function formatPrice(priceInCents: number) {
  return `$${(priceInCents / 100).toFixed(priceInCents % 100 === 0 ? 0 : 2)}`;
}

interface Signature {
  Args: {
    billing: Future<ReactiveDataDocument<BillingStatus>>;
  };
}

export default class Pricing extends Component<Signature> {
  @tracked isSubmitting = false;

  checkout = async (planKey: string) => {
    this.isSubmitting = true;

    try {
      await startCheckout(planKey);
    } finally {
      this.isSubmitting = false;
    }
  };

  manageBilling = async () => {
    this.isSubmitting = true;

    try {
      await openBillingPortal();
    } finally {
      this.isSubmitting = false;
    }
  };

  <template>
    <main class="pricing-page">
      <section class="pricing-card surface">
        <h1>Pricing</h1>
        <p>Choose a plan for your monthly link allowance.</p>

        <Request @request={{@billing}}>
          <:loading>
            <p>Loading plans…</p>
          </:loading>

          <:error>
            <p>Could not load plans. Refresh to try again.</p>
          </:error>

          <:content as |doc|>
            {{#let doc.data as |billing|}}
              {{#if billing.hasActiveSubscription}}
                <p>Your current plan is {{billing.plan.name}}.</p>
                <Button
                  @onClick={{this.manageBilling}}
                  @disabled={{if this.isSubmitting "Opening billing portal..."}}
                >
                  Manage subscription
                </Button>
              {{else}}
                <div class="plans">
                  {{#each billing.availablePlans as |plan|}}
                    <article class="plan surface">
                      <h2>{{plan.name}}</h2>
                      <p>{{formatPrice plan.priceInCents}}/month</p>
                      <p>{{plan.monthlyLinkLimit}} links/month</p>
                      <Button
                        @onClick={{fn this.checkout plan.key}}
                        @disabled={{if this.isSubmitting "Opening checkout..."}}
                      >
                        Choose {{plan.name}}
                      </Button>
                    </article>
                  {{/each}}
                </div>
              {{/if}}
            {{/let}}
          </:content>
        </Request>
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
