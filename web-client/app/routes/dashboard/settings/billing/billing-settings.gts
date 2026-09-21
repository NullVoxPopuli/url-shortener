import { Request } from '@warp-drive/ember';

import { formatDate } from '../../format.ts';
import { BillingTimeline } from './billing-timeline.gts';
import { InvoiceTable } from './invoice-table.gts';
import { SubscriptionDetails } from './subscription-details.gts';

import type { TOC } from '@ember/component/template-only';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { BillingHistory, BillingStatus, BillingSubscription } from '#app/data/types';

/**
 * The subscription the account cache points at, read live from Stripe.
 * Falls back to the newest one, which covers a customer whose cache is stale.
 */
function currentSubscription(billing: BillingStatus, history: BillingHistory | null) {
  if (!history) return null;

  const id = billing.stripe.subscriptionId;

  return history.subscriptions.find((s) => s.id === id) ?? history.subscriptions[0] ?? null;
}

function pastSubscriptions(history: BillingHistory, current: BillingSubscription | null) {
  return history.subscriptions.filter((s) => s.id !== current?.id);
}

interface Signature {
  Args: {
    isAdmin: boolean;
    billing: Future<ReactiveDataDocument<BillingStatus>>;
    history: Future<ReactiveDataDocument<BillingHistory>> | null;
  };
}

const BillingSettings: TOC<Signature> = <template>
  <div class="page-shell">
    <h1>Billing</h1>

    <Request @request={{@billing}}>
      <:loading>
        <p class="muted">Loading your subscription…</p>
      </:loading>

      <:error>
        <p class="warning">Could not load your billing status. Refresh to try
          again.</p>
      </:error>

      <:content as |billingDoc|>
        {{#if @history}}
          <Request @request={{@history}}>
            <:loading>
              <SubscriptionDetails @billing={{billingDoc.data}} @subscription={{null}} />
              <p class="muted">Loading your billing history…</p>
            </:loading>

            <:error>
              <SubscriptionDetails @billing={{billingDoc.data}} @subscription={{null}} />
              <p class="warning">Could not load your billing history from Stripe.
                Refresh to try again.</p>
            </:error>

            <:content as |historyDoc|>
              {{#let (currentSubscription billingDoc.data historyDoc.data) as |current|}}
                <SubscriptionDetails
                  @billing={{billingDoc.data}}
                  @subscription={{current}}
                />

                <section class="page-card surface">
                  <h2>Subscription history</h2>
                  <BillingTimeline @events={{historyDoc.data.events}} />
                </section>

                {{#let (pastSubscriptions historyDoc.data current) as |past|}}
                  {{#if past.length}}
                    <section class="page-card surface">
                      <h2>Past subscriptions</h2>
                      <ul class="past-list">
                        {{#each past as |subscription|}}
                          <li>
                            <strong>{{subscription.planName}}</strong>
                            <span class="muted">
                              {{subscription.status}}
                              ·
                              started
                              {{formatDate subscription.startedAt}}
                              {{#if subscription.endedAt}}
                                · ended
                                {{formatDate subscription.endedAt}}
                              {{/if}}
                            </span>
                          </li>
                        {{/each}}
                      </ul>
                    </section>
                  {{/if}}
                {{/let}}

                <section class="page-card surface">
                  <h2>Payment history</h2>
                  <InvoiceTable @invoices={{historyDoc.data.invoices}} />
                </section>
              {{/let}}
            </:content>
          </Request>
        {{else}}
          <SubscriptionDetails @billing={{billingDoc.data}} @subscription={{null}} />

          <section class="page-card surface">
            <h2>Payment history</h2>
            <p class="muted">Only the account admin can see invoices and past
              subscriptions.</p>
          </section>
        {{/if}}
      </:content>
    </Request>
  </div>

  <style scoped>
    .page-shell {
      width: min(100%, 56rem);
      margin: 0 auto;
      display: grid;
      gap: var(--gap-4);
    }

    .page-shell h1 {
      margin: 0;
    }

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

    .past-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: var(--gap-2);
    }

    .muted {
      opacity: 0.7;
    }

    .warning {
      color: var(--color-danger);
    }
  </style>
</template>;

export default BillingSettings;
