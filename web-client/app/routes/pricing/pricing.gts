import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';

import { Request } from '@warp-drive/ember';
import { Button } from 'nvp.ui';

import { openBillingPortal, startCheckout } from '#app/data/billing';

import type { TOC } from '@ember/component/template-only';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { BillingInterval, BillingStatus, PlanResource } from '#app/data/types';

const CONTACT_EMAIL = 'sales@nvp.gg';
const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=Custom plan inquiry`;

function formatPrice(priceInCents: number) {
  return `$${(priceInCents / 100).toFixed(priceInCents % 100 === 0 ? 0 : 2)}`;
}

function priceLabel(plan: PlanResource, interval: BillingInterval) {
  return `${formatPrice(plan.prices[interval].amountInCents)}/${interval}`;
}

function isInterval(current: BillingInterval, candidate: BillingInterval) {
  return current === candidate;
}

/**
 * Marketing copy for each plan, keyed by the API's plan key.
 * Quotas (links/month, price) come from the API; these lists are
 * display-only.
 */
const PLAN_FEATURES: Record<string, string[]> = {
  base: ['15 QR codes/month (non-watermarked)'],
  essentials: ['100 QR codes/month', 'Advanced click statistics', '2 custom domains'],
  pro: [
    '1000 QR codes/month',
    'Advanced click statistics',
    '3 custom domains',
    '50 link / QR code edits per month',
    '50 password-protected links',
    'Link expiration',
    '2 teammates',
  ],
  vast: [
    '10000 QR codes/month',
    'Advanced click statistics',
    '10 custom domains',
    '500 link / QR code edits per month',
    'Link expiration',
    '10 teammates',
  ],
};

const FREE_FEATURES = ['5 links/month', '5 QR codes/month (watermarked)', 'Basic click stats'];

const CUSTOM_FEATURES = [
  'Everything in Vast',
  'Custom volumes',
  'SSO / SAML',
  'Custom authentication',
  'Dedicated customer success manager',
];

function featuresFor(planKey: string) {
  return PLAN_FEATURES[planKey] ?? [];
}

function isCurrentPlan(plan: PlanResource, billing: BillingStatus | null) {
  return Boolean(billing?.hasActiveSubscription) && plan.key === billing?.plan.key;
}

function hasSubscription(billing: BillingStatus | null) {
  return Boolean(billing?.hasActiveSubscription);
}

interface PlanCardsSignature {
  Args: {
    plans: PlanResource[];
    /**
     * null for a visitor without a session: the cards then link to
     * sign-in instead of starting a checkout.
     */
    billing: BillingStatus | null;
    interval: BillingInterval;
    isSubmitting: boolean;
    checkout: (planKey: string) => unknown;
  };
}

export const PlanCards: TOC<PlanCardsSignature> = <template>
  {{#each @plans as |plan|}}
    <article class="plan surface" data-plan={{plan.key}}>
      <h2>{{plan.name}}</h2>
      <p class="price">{{priceLabel plan @interval}}</p>
      <ul class="features">
        <li>{{plan.monthlyLinkLimit}} links/month</li>
        {{#each (featuresFor plan.key) as |feature|}}
          <li>{{feature}}</li>
        {{/each}}
      </ul>
      {{#if (isCurrentPlan plan @billing)}}
        <p class="current-plan">Your current plan</p>
      {{else if (hasSubscription @billing)}}
        {{! plan changes happen in the billing portal }}
      {{else if @billing}}
        <Button
          @onClick={{fn @checkout plan.key}}
          @disabled={{if @isSubmitting "Opening checkout..."}}
        >
          Choose {{plan.name}}
        </Button>
      {{else}}
        <a class="signin-link" href="/auth/login">Sign in to choose {{plan.name}}</a>
      {{/if}}
    </article>
  {{/each}}

  <style scoped>
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

    .signin-link {
      justify-self: start;
    }
  </style>
</template>;

const CustomPlan = <template>
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

  <style scoped>
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

    .contact-link {
      justify-self: start;
    }
  </style>
</template>;

const FreeCopy = <template>
  <div class="free-copy">
    <h2>Free</h2>
    <p class="price">$0/month</p>
    <ul class="features features-row">
      {{#each FREE_FEATURES as |feature|}}
        <li>{{feature}}</li>
      {{/each}}
    </ul>
  </div>

  <style scoped>
    .free-copy {
      display: grid;
      gap: 0.5rem;
    }

    .free-copy h2,
    .free-copy p {
      margin: 0;
    }

    .price {
      font-weight: 600;
    }

    .features {
      margin: 0;
      padding-left: 1.1rem;
      font-size: 0.9rem;
    }

    .features-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem 2rem;
    }
  </style>
</template>;

interface Signature {
  Args: {
    plans: Future<ReactiveDataDocument<PlanResource[]>>;
    billing: Future<ReactiveDataDocument<BillingStatus>> | null;
  };
}

export default class Pricing extends Component<Signature> {
  @tracked isSubmitting = false;
  @tracked interval: BillingInterval = 'month';

  setInterval = (interval: BillingInterval) => {
    this.interval = interval;
  };

  checkout = async (planKey: string) => {
    this.isSubmitting = true;

    try {
      await startCheckout(planKey, this.interval);
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

        <Request @request={{@plans}}>
          <:loading>
            <p>Loading plans…</p>
          </:loading>

          <:error>
            <p>Could not load plans. Refresh to try again.</p>
          </:error>

          <:content as |plansDoc|>
            <div class="interval-toggle" role="group" aria-label="Billing interval">
              <button
                type="button"
                class="interval-button"
                aria-pressed={{if (isInterval this.interval "month") "true" "false"}}
                {{on "click" (fn this.setInterval "month")}}
              >
                Monthly
              </button>
              <button
                type="button"
                class="interval-button"
                aria-pressed={{if (isInterval this.interval "year") "true" "false"}}
                {{on "click" (fn this.setInterval "year")}}
              >
                Yearly
              </button>
            </div>

            {{#if @billing}}
              <Request @request={{@billing}} @autorefresh="invalid">
                <:loading>
                  <p>Loading your subscription…</p>
                </:loading>

                <:error>
                  <p>Could not load your subscription. Refresh to try again.</p>
                </:error>

                <:content as |billingDoc|>
                  {{#let billingDoc.data as |billing|}}
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
                      <PlanCards
                        @plans={{plansDoc.data}}
                        @billing={{billing}}
                        @interval={{this.interval}}
                        @isSubmitting={{this.isSubmitting}}
                        @checkout={{this.checkout}}
                      />
                      <CustomPlan />
                    </div>

                    <article class="free-plan surface">
                      <FreeCopy />
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
            {{else}}
              <div class="plans">
                <PlanCards
                  @plans={{plansDoc.data}}
                  @billing={{null}}
                  @interval={{this.interval}}
                  @isSubmitting={{false}}
                  @checkout={{this.checkout}}
                />
                <CustomPlan />
              </div>

              <article class="free-plan surface">
                <FreeCopy />
                <a class="signin-link" href="/auth/login">Sign in to get started</a>
              </article>
            {{/if}}
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

      .interval-toggle {
        display: inline-flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .interval-button {
        padding: 0.375rem 0.75rem;
        border: var(--border-width) var(--border-style) var(--border-color);
        border-radius: var(--radius);
        background: none;
        color: var(--color-text);
        cursor: pointer;
      }

      .interval-button[aria-pressed="true"] {
        background: var(--color-text);
        color: var(--surface-background-color);
      }

      .plans {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }

      .free-plan {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border: var(--border-width) var(--border-style) var(--border-color);
        border-radius: var(--radius);
        background: var(--surface-background-color);
      }

      .free-plan p {
        margin: 0;
      }

      .current-plan {
        font-weight: 600;
        opacity: 0.7;
      }

      .signin-link {
        justify-self: start;
      }

      @media (max-width: 1000px) {
        .plans {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    </style>
  </template>
}
