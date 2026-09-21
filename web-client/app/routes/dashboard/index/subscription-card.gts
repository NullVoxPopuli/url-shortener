import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { service } from '@ember/service';

import { openBillingPortal } from '#app/data/billing';

import { formatDate } from '../format.ts';

import type RouterService from '@ember/routing/router-service';
import type { BillingStatus } from '#app/data/types';

function isFree(billing: BillingStatus) {
  return billing.plan.key === 'free';
}

function hasNoSubscription(billing: BillingStatus) {
  return billing.plan.key === 'none';
}

interface Signature {
  Args: {
    billing: BillingStatus;
  };
}

/**
 * JS uses ms-since-epoch.
 * But standard outside of JS is seconds since epoch.
 */
function stripeDate(value: number | string | null) {
  if (!value) return '—';

  const ms = Number(value) * 1000;

  return formatDate(ms);
}

export class SubscriptionCard extends Component<Signature> {
  @service declare router: RouterService;

  @tracked isSubmitting = false;

  /**
   * The account is the first URL segment, the `dashboard` route's param.
   */
  get billingHref() {
    const dashboard = this.router.currentRoute?.find((info) => info.name === 'dashboard');
    const slug = dashboard?.params?.['account_id'];

    return typeof slug === 'string' ? `/${slug}/settings/billing` : null;
  }

  manageBilling = async () => {
    this.isSubmitting = true;

    try {
      await openBillingPortal();
    } finally {
      this.isSubmitting = false;
    }
  };

  <template>
    <section class="dashboard-card surface">
      <h2>Subscription</h2>

      {{#if (hasNoSubscription @billing)}}
        <p class="plan-name">No subscription</p>
        <p class="muted">You're on the starter allowance of
          {{@billing.plan.monthlyLinkLimit}}
          links per month.</p>
      {{else if (isFree @billing)}}
        <p class="plan-name">Free account</p>
        <p class="muted">Unlimited links, on the house.</p>
      {{else}}
        <p class="plan-name">{{@billing.plan.name}}</p>
        <p class="muted">
          Current period:
          {{stripeDate @billing.stripe.currentPeriodStart}}
          –
          {{stripeDate @billing.stripe.currentPeriodEnd}}
        </p>
        {{#if @billing.stripe.cancelAtPeriodEnd}}
          <p class="warning">Cancellation is scheduled for the end of the
            current period.</p>
        {{/if}}
      {{/if}}

      <div class="card-actions">
        {{#if @billing.hasActiveSubscription}}
          <button
            type="button"
            disabled={{this.isSubmitting}}
            {{on "click" this.manageBilling}}
          >
            Manage billing
          </button>
          {{#if this.billingHref}}
            <a href={{this.billingHref}}>Billing details</a>
          {{/if}}
        {{else}}
          <a href="/pricing">View pricing and plans</a>
        {{/if}}
      </div>
    </section>

    <style scoped>
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

      .dashboard-card p {
        margin: 0 0 var(--gap-2);
      }

      .plan-name {
        font-size: 1.5rem;
        font-weight: 600;
      }

      .muted {
        opacity: 0.7;
      }

      .warning {
        color: var(--color-danger);
      }

      .card-actions {
        margin-top: var(--gap-3);
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--gap-3);
      }
    </style>
  </template>
}
