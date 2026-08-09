import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';

import { Request } from '@warp-drive/ember';
import { Button } from 'nvp.ui';

import { openBillingPortal, startCheckout } from '#app/data/billing';

import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { BillingStatus, Plan } from '#app/data/types';

const CONTACT_EMAIL = 'sales@nvp.gg';
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=Custom plan inquiry`;

function formatPrice(priceInCents: number) {
  return `$${(priceInCents / 100).toFixed(priceInCents % 100 === 0 ? 0 : 2)}`;
}

/**
 * Marketing copy for each plan, keyed by the API's plan key.
 * Quotas (links/month, price) come from the API; these lists are
 * display-only.
 */
const PLAN_FEATURES: Record<string, string[]> = {
  'side-hobby': ['15 QR codes/month (non-watermarked)'],
  hobby: ['100 QR codes/month', 'Advanced click statistics', '2 custom domains'],
  project: [
    '1000 QR codes/month',
    'Advanced click statistics',
    '3 custom domains',
    '50 link / QR code edits per month',
    '50 password-protected links',
    'Link expiration',
    '2 teammates',
  ],
};

const FREE_FEATURES = [
  '5 links/month',
  '5 QR codes/month (watermarked)',
  'Basic click stats',
];

const CUSTOM_FEATURES = [
  'Everything in Project',
  'Custom volumes',
  'SSO / SAML',
  'Custom authentication',
  'Dedicated customer success manager',
];

function featuresFor(planKey: string) {
  return PLAN_FEATURES[planKey] ?? [];
}

function isCurrentPlan(plan: Plan, billing: BillingStatus) {
  return billing.hasActiveSubscription && plan.key === billing.plan.key;
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
              {{/if}}

              <div class="plans">
                {{#each billing.availablePlans as |plan|}}
                  <article class="plan surface">
                    <h2>{{plan.name}}</h2>
                    <p class="price">{{formatPrice plan.priceInCents}}/month</p>
                    <ul class="features">
                      <li>{{plan.monthlyLinkLimit}} links/month</li>
                      {{#each (featuresFor plan.key) as |feature|}}
                        <li>{{feature}}</li>
                      {{/each}}
                    </ul>
                    {{#if (isCurrentPlan plan billing)}}
                      <p class="current-plan">Your current plan</p>
                    {{else}}
                      {{#unless billing.hasActiveSubscription}}
                        <Button
                          @onClick={{fn this.checkout plan.key}}
                          @disabled={{if this.isSubmitting "Opening checkout..."}}
                        >
                          Choose {{plan.name}}
                        </Button>
                      {{/unless}}
                    {{/if}}
                  </article>
                {{/each}}

                <article class="plan surface">
                  <h2>Custom</h2>
                  <p class="price">Let's talk</p>
                  <ul class="features">
                    {{#each CUSTOM_FEATURES as |feature|}}
                      <li>{{feature}}</li>
                    {{/each}}
                  </ul>
                  <a class="contact-link" href={{CONTACT_HREF}}>
                    {{CONTACT_EMAIL}}
                  </a>
                </article>
              </div>

              <article class="plan free-plan surface">
                <div class="free-copy">
                  <h2>Free</h2>
                  <p class="price">$0/month</p>
                  <ul class="features features-row">
                    {{#each FREE_FEATURES as |feature|}}
                      <li>{{feature}}</li>
                    {{/each}}
                  </ul>
                </div>
                {{#if billing.hasActiveSubscription}}
                  <Button
                    @onClick={{this.manageBilling}}
                    @disabled={{if this.isSubmitting "Opening billing portal..."}}
                  >
                    Cancel subscription
                  </Button>
                {{else}}
                  <p class="current-plan">Your current plan</p>
                {{/if}}
              </article>
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
        width: min(100%, 72rem);
        margin: 0 auto;
        padding: 2rem;
        border-radius: var(--radius);
        background: var(--surface-background-color);
      }

      .plans {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }

      .plan {
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        gap: 0.75rem;
        padding: 1rem;
        border: var(--border-width) var(--border-style) var(--border-color);
        border-radius: var(--radius);
        background: var(--surface-background-color);
      }

      .plan h2,
      .plan p {
        margin: 0;
      }

      .price {
        font-weight: 600;
      }

      .features {
        margin: 0;
        padding-left: 1.1rem;
        display: grid;
        gap: 0.375rem;
        font-size: 0.9rem;
        align-content: start;
      }

      .current-plan {
        font-weight: 600;
        opacity: 0.7;
      }

      .contact-link {
        justify-self: start;
      }

      .free-plan {
        margin-top: 1rem;
        grid-template-rows: none;
        grid-template-columns: 1fr auto;
        align-items: center;
      }

      .free-copy {
        display: grid;
        gap: 0.5rem;
      }

      .features-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem 2rem;
      }

      @media (max-width: 1000px) {
        .plans {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 700px) {
        .plans {
          grid-template-columns: 1fr;
        }

        .free-plan {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </template>
}
