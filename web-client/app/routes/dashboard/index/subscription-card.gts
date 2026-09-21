import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

import { openBillingPortal } from '#app/data/billing';

import { formatDate } from '../format.ts';

import type { BillingStatus, Overage } from '#app/data/types';

function isFree(billing: BillingStatus) {
  return billing.plan.key === 'free';
}

function hasNoSubscription(billing: BillingStatus) {
  return billing.plan.key === 'none';
}

const OVERAGE_LABELS: Record<Overage['resource'], string> = {
  links: 'links this month',
  linkEdits: 'link edits this month',
  expiringLinks: 'links with an expiration this month',
  customDomains: 'custom domains',
  apiKeys: 'API keys',
  teammates: 'teammates',
};

function describeOverages(overages: Overage[]) {
  return overages
    .map((overage) => `${overage.used} ${OVERAGE_LABELS[overage.resource]} (limit ${overage.limit})`)
    .join(', ');
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
  @tracked isSubmitting = false;

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

      {{#if @billing.isGlimdown}}
        <p class="plan-name" data-test-glimdown>Glimdown</p>
        <p class="muted">The shared account behind glimdown.com and repl.nvp.gg links.
          Anyone shortens one without signing in, and nothing is billed.</p>
      {{else if (hasNoSubscription @billing)}}
        <p class="plan-name" data-test-free-plan>Free</p>
        <ul class="plan-includes">
          <li>{{@billing.plan.monthlyLinkLimit}} links a month</li>
          <li>Watermarked QR codes</li>
          <li>Basic click stats</li>
        </ul>
        <p class="muted">No card on file. Nothing renews.</p>
      {{else if (isFree @billing)}}
        <p class="plan-name" data-test-legacy-free>Free, unlimited</p>
        <p class="muted">A legacy account: unlimited links, and nothing to bill.</p>
      {{else}}
        <p class="plan-name">{{@billing.plan.name}}</p>
        <p class="muted">
          Current period:
          {{stripeDate @billing.stripe.currentPeriodStart}}
          –
          {{stripeDate @billing.stripe.currentPeriodEnd}}
        </p>
        {{#if @billing.stripe.cancelAtPeriodEnd}}
          <p class="warning" data-test-cancelling>Cancelling. Your
            {{@billing.plan.name}}
            plan ends
            {{stripeDate @billing.stripe.currentPeriodEnd}}.</p>
        {{else if @billing.pendingDowngrade}}
          <p class="muted" data-test-downgrading>{{@billing.plan.name}}
            until
            {{stripeDate @billing.pendingDowngrade.at}}, then
            {{@billing.pendingDowngrade.plan.name}}.</p>
          {{#if @billing.pendingDowngrade.overages.length}}
            <p class="warning" data-test-overages>Over
              {{@billing.pendingDowngrade.plan.name}}'s limits:
              {{describeOverages @billing.pendingDowngrade.overages}}.</p>
          {{/if}}
        {{/if}}
      {{/if}}

      {{#unless (isFree @billing)}}
        <div class="card-actions" data-test-actions>
          {{#if @billing.hasActiveSubscription}}
            <button
              type="button"
              disabled={{this.isSubmitting}}
              {{on "click" this.manageBilling}}
            >
              Manage billing
            </button>
          {{else}}
            <a href="/pricing" data-test-upgrade>Upgrade for more links, QR codes without
              a watermark, and custom domains</a>
          {{/if}}
        </div>
      {{/unless}}
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

      .plan-includes {
        margin: 0 0 var(--gap-2);
        padding-left: 1.1rem;
        display: grid;
        gap: var(--gap-1);
      }

      .muted {
        opacity: 0.7;
      }

      .warning {
        color: var(--color-danger);
      }

      .card-actions {
        margin-top: var(--gap-3);
      }
    </style>
  </template>
}
