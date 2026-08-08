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
}

export interface LinkResource {
  id: string;
  attributes: Record<string, unknown>;
}

export default class DashboardService extends Service {
  @tracked billing: BillingStatus | null = null;
  @tracked links: LinkResource[] = [];

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
