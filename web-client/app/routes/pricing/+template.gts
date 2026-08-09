import { SiteChrome } from '../application/site-chrome';
import Pricing from './pricing';

<template>
  <SiteChrome>
    {{! @glint-expect-error - route templates do not have typed @model }}
    <Pricing @billing={{@model.billing}} />
  </SiteChrome>
</template>
