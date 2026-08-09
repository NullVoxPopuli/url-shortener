import Pricing from './pricing';

<template>
  {{! @glint-expect-error - route templates do not have typed @model }}
  <Pricing @billing={{@model.billing}} />
</template>
