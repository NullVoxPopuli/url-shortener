import { formatDate } from '../../format.ts';

import type { TOC } from '@ember/component/template-only';
import type { BillingEvent } from '#app/data/types';

function describe(event: BillingEvent) {
  switch (event.kind) {
    case 'subscribed':
      return `Subscribed to ${event.planName ?? 'a plan'}`;
    case 'plan-changed':
      return `Changed plan from ${event.previousPlanName ?? 'unknown'} to ${event.planName ?? 'unknown'}`;
    case 'cancellation-scheduled':
      return `Cancellation requested. ${event.planName ?? 'The plan'} ends ${formatDate(event.endsAt)}`;
    case 'canceled':
      return `Canceled ${event.planName ?? 'the plan'}`;
    case 'ended':
      return `${event.planName ?? 'The plan'} ended`;
  }
}

interface Signature {
  Args: {
    events: BillingEvent[];
  };
}

export const BillingTimeline: TOC<Signature> = <template>
  {{#if @events.length}}
    <ol class="timeline">
      {{#each @events as |event|}}
        <li class="timeline-entry kind-{{event.kind}}">
          <time datetime={{event.at}}>{{formatDate event.at}}</time>
          <span>{{describe event}}</span>
        </li>
      {{/each}}
    </ol>
  {{else}}
    <p class="muted">No subscription activity yet.</p>
  {{/if}}

  <style scoped>
    .timeline {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: var(--gap-2);
    }

    .timeline-entry {
      display: grid;
      grid-template-columns: 8rem 1fr;
      gap: var(--gap-3);
    }

    .timeline-entry time {
      opacity: 0.7;
      white-space: nowrap;
    }

    .kind-cancellation-scheduled,
    .kind-canceled {
      color: var(--color-danger);
    }

    .muted {
      opacity: 0.7;
    }

    @media (max-width: 600px) {
      .timeline-entry {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
  </style>
</template>;
