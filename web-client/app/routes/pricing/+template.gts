import { SiteChrome } from '../application/site-chrome.gts';
import Pricing from './pricing.gts';

<template>
  <SiteChrome>
    {{! @glint-expect-error - route templates do not have typed @model }}
    <Pricing @billing={{@model.billing}} />
  </SiteChrome>
</template>
