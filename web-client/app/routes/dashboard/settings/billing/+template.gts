import BillingSettings from './billing-settings.gts';

import type { TOC } from '@ember/component/template-only';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { BillingHistory, BillingStatus } from '#app/data/types';

<template>
  <BillingSettings
    @isAdmin={{@model.isAdmin}}
    @billing={{@model.billing}}
    @history={{@model.history}}
  />
</template> satisfies TOC<{
  Args: {
    model: {
      isAdmin: boolean;
      billing: Future<ReactiveDataDocument<BillingStatus>>;
      history: Future<ReactiveDataDocument<BillingHistory>> | null;
    };
  };
}>;
