import { SiteChrome } from '../application/site-chrome.gts';
import Pricing from './pricing.gts';

import type { TOC } from '@ember/component/template-only';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { BillingStatus, PlanResource } from '#app/data/types';

<template>
  <SiteChrome>
    <Pricing @plans={{@model.plans}} @billing={{@model.billing}} />
  </SiteChrome>
</template> satisfies TOC<{
  Args: {
    model: {
      plans: Future<ReactiveDataDocument<PlanResource[]>>;
      billing: Future<ReactiveDataDocument<BillingStatus>> | null;
    };
  };
}>;
