import { htmlSafe } from '@ember/template';

import { formatUtcDateTime } from './format';

import type { TOC } from '@ember/component/template-only';
import type { BillingStatus } from '#app/data/types';

function isUnlimited(billing: BillingStatus) {
  return billing.plan.monthlyLinkLimit === null;
}

function isExhausted(billing: BillingStatus) {
  return !isUnlimited(billing) && billing.usage.remaining === 0;
}

function usagePercent(billing: BillingStatus) {
  const limit = billing.plan.monthlyLinkLimit;

  if (!limit) return 0;

  return Math.min(100, Math.round((billing.usage.used / limit) * 100));
}

function usageBarStyle(billing: BillingStatus) {
  return htmlSafe(`width: ${usagePercent(billing)}%`);
}

interface Signature {
  Args: {
    billing: BillingStatus;
  };
}

export const UsageCard: TOC<Signature> = <template>
  <section class="dashboard-card surface">
    <h2>Usage</h2>

    {{#if (isUnlimited @billing)}}
      <p class="stat">
        <span class="stat-number">{{@billing.usage.used}}</span>
        links created this month
      </p>
      <p class="muted">Unlimited links</p>
    {{else}}
      <p class="stat">
        <span class="stat-number">{{@billing.usage.used}}</span>
        of
        {{@billing.plan.monthlyLinkLimit}}
        links used this month
      </p>
      <div
        class="usage-meter"
        role="progressbar"
        aria-label="Monthly link usage"
        aria-valuemin="0"
        aria-valuemax="{{@billing.plan.monthlyLinkLimit}}"
        aria-valuenow="{{@billing.usage.used}}"
      >
        <div
          class="usage-meter-fill {{if (isExhausted @billing) 'is-exhausted'}}"
          style={{usageBarStyle @billing}}
        ></div>
      </div>
      {{#if (isExhausted @billing)}}
        <p class="warning">You've used your quota for this month. It resets on
          {{formatUtcDateTime @billing.usage.periodEnd}}.</p>
      {{else}}
        <p class="muted">{{@billing.usage.remaining}}
          remaining until
          {{formatUtcDateTime @billing.usage.periodEnd}}</p>
      {{/if}}
    {{/if}}
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

    .stat {
      font-size: 1.125rem;
    }

    .stat-number {
      font-size: 1.75rem;
      font-weight: 700;
    }

    .muted {
      opacity: 0.7;
    }

    .warning {
      color: var(--color-danger);
    }

    .usage-meter {
      height: 0.5rem;
      margin: var(--gap-2) 0;
      border-radius: 999px;
      background: color-mix(in srgb, var(--color-text) 15%, transparent);
      overflow: hidden;
    }

    .usage-meter-fill {
      height: 100%;
      border-radius: inherit;
      background: var(--color-primary);
      transition: width var(--fade-duration) ease-out;
    }

    .usage-meter-fill.is-exhausted {
      background: var(--color-danger);
    }
  </style>
</template>;
