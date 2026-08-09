import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

import config from '#config';

export interface BillingStatus {
  isFree: boolean;
  hasActiveSubscription: boolean;
  stripe: {
    subscriptionStatus: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  plan: {
    key: string;
    name: string;
    monthlyLinkLimit: number | null;
  };
  usage: {
    used: number;
    remaining: number | null;
    periodStart: string;
    periodEnd: string;
  };
  availablePlans: Array<{
    key: string;
    name: string;
    priceInCents: number;
    monthlyLinkLimit: number;
    stripePriceId: string;
  }>;
}

export interface LinkResource {
  id: string;
  attributes: Record<string, unknown>;
}

export default class DashboardService extends Service {
  @tracked billing: BillingStatus | null = null;
  @tracked links: LinkResource[] = [];
  @tracked isSubmitting = false;

  get isFree() {
    return this.billing?.plan.key === 'free';
  }

  get hasNoSubscription() {
    return this.billing?.plan.key === 'none';
  }

  async refresh() {
    const [billingResponse, linksResponse] = await Promise.all([
      this.fetchApi('/v1/billing/status'),
      this.fetchApi('/v1/links'),
    ]);

    const billing = await billingResponse.json();
    const links = await linksResponse.json();

    this.billing = billing.data.attributes as BillingStatus;
    this.links = links.data as LinkResource[];
  }

  async checkout(planKey: string) {
    this.isSubmitting = true;

    try {
      const response = await fetch(`${config.apiOrigin}/v1/billing/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!response.ok) throw new Error(`Checkout request failed: ${response.status}`);

      const result = await response.json();
      const url = result.data?.attributes?.url;

      if (typeof url !== 'string') throw new Error('Checkout did not return a URL');

      window.location.assign(url);
    } finally {
      this.isSubmitting = false;
    }
  }

  async openBillingPortal() {
    this.isSubmitting = true;

    try {
      const response = await fetch(`${config.apiOrigin}/v1/billing/portal`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      });

      if (!response.ok) throw new Error(`Billing portal request failed: ${response.status}`);

      const result = await response.json();
      const url = result.data?.attributes?.url;

      if (typeof url !== 'string') throw new Error('Billing portal did not return a URL');

      window.location.assign(url);
    } finally {
      this.isSubmitting = false;
    }
  }

  private fetchApi(path: string) {
    return fetch(`${config.apiOrigin}${path}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    }).then((response) => {
      if (!response.ok) throw new Error(`Dashboard request failed: ${response.status}`);

      return response;
    });
  }
}

declare module '@ember/service' {
  interface Registry {
    dashboard: DashboardService;
  }
}
