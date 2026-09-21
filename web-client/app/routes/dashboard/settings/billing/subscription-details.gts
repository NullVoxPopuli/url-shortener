import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

import { openBillingPortal } from '#app/data/billing';

import { formatDate, formatMoney } from '../../format.ts';

import type { BillingStatus, BillingSubscription } from '#app/data/types';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past due',
  unpaid: 'Unpaid',
  paused: 'Paused',
  canceled: 'Canceled',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
};

function statusLabel(status: string | null) {
  if (!status) return 'None';

  return STATUS_LABELS[status] ?? status;
}

function price(subscription: BillingSubscription) {
  const amount = formatMoney(subscription.amountInCents, subscription.currency);

  return subscription.interval ? `${amount} / ${subscription.interval}` : amount;
}

/**
 * When the subscription stops, for a scheduled or a completed cancellation.
 */
function endsAt(subscription: BillingSubscription) {
  return subscription.endedAt ?? subscription.cancelAt ?? subscription.currentPeriodEnd;
}

function isCancelScheduled(subscription: BillingSubscription) {
  return (
    subscription.status !== 'canceled' &&
    (subscription.cancelAtPeriodEnd || subscription.cancelAt !== null)
  );
}

interface Signature {
  Args: {
    billing: BillingStatus;
    /**
     * The live Stripe subscription, when the viewer can see it.
     * Without it, the card shows the cached status only.
     */
    subscription: BillingSubscription | null;
  };
}

export class SubscriptionDetails extends Component<Signature> {
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
    <section class="page-card surface">
      <h2>Current subscription</h2>

      {{#if @subscription}}
        <p class="plan-name">{{@subscription.planName}}</p>

        <dl class="details">
          <dt>Status</dt>
          <dd>
            <span class="status status-{{@subscription.status}}">
              {{statusLabel @subscription.status}}
            </span>
          </dd>

          <dt>Price</dt>
          <dd>{{price @subscription}}</dd>

          <dt>Subscribed since</dt>
          <dd>{{formatDate @subscription.startedAt}}</dd>

          <dt>Current period</dt>
          <dd>
            {{formatDate @subscription.currentPeriodStart}}
            –
            {{formatDate @subscription.currentPeriodEnd}}
          </dd>

          {{#if @subscription.trialEnd}}
            <dt>Trial ends</dt>
            <dd>{{formatDate @subscription.trialEnd}}</dd>
          {{/if}}

          {{#if (isCancelScheduled @subscription)}}
            <dt>Cancellation</dt>
            <dd class="warning">
              Requested
              {{formatDate @subscription.canceledAt}}.
              Your plan ends
              {{formatDate (endsAt @subscription)}}.
            </dd>
          {{/if}}

          {{#if @subscription.endedAt}}
            <dt>Ended</dt>
            <dd>{{formatDate @subscription.endedAt}}</dd>
          {{/if}}

          {{#if @billing.paymentMethod.last4}}
            <dt>Payment method</dt>
            <dd>{{@billing.paymentMethod.brand}} ending in {{@billing.paymentMethod.last4}}</dd>
          {{/if}}
        </dl>
      {{else if @billing.hasActiveSubscription}}
        <p class="plan-name">{{@billing.plan.name}}</p>

        <dl class="details">
          <dt>Status</dt>
          <dd>{{statusLabel @billing.stripe.subscriptionStatus}}</dd>

          <dt>Current period</dt>
          <dd>
            {{formatDate @billing.stripe.currentPeriodStart}}
            –
            {{formatDate @billing.stripe.currentPeriodEnd}}
          </dd>

          {{#if @billing.stripe.cancelAtPeriodEnd}}
            <dt>Cancellation</dt>
            <dd class="warning">
              Your plan ends
              {{formatDate @billing.stripe.currentPeriodEnd}}.
            </dd>
          {{/if}}
        </dl>
      {{else}}
        <p class="plan-name">{{@billing.plan.name}}</p>
        <p class="muted">This account has no paid subscription.</p>
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
          <span class="muted">Change plan, update payment, or cancel in the
            Stripe portal.</span>
        {{else}}
          <a href="/pricing">View pricing and plans</a>
        {{/if}}
      </div>
    </section>

    <style scoped>
      .page-card {
        margin: 0;
        padding: var(--padding-4) 1.5rem;
        border: var(--border-width) var(--border-style) var(--border-color);
        border-radius: var(--radius);
        background: var(--surface-background-color);
      }

      .page-card h2 {
        margin: 0 0 var(--gap-3);
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.7;
      }

      .plan-name {
        margin: 0 0 var(--gap-3);
        font-size: 1.5rem;
        font-weight: 600;
      }

      .details {
        margin: 0;
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: var(--gap-2) var(--gap-4);
      }

      .details dt {
        opacity: 0.7;
      }

      .details dd {
        margin: 0;
      }

      .status {
        display: inline-block;
        padding: 0 var(--padding-2);
        border-radius: var(--radius);
        border: var(--border-width) var(--border-style) var(--border-color);
      }

      .status-past_due,
      .status-unpaid,
      .status-canceled {
        color: var(--color-danger);
        border-color: currentColor;
      }

      .card-actions {
        margin-top: var(--gap-3);
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--gap-3);
      }

      .muted {
        opacity: 0.7;
      }

      .warning {
        color: var(--color-danger);
      }
    </style>
  </template>
}
