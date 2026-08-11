import LinkManager from './link-manager';

<template>
  {{! @glint-expect-error - route templates do not have typed @model }}
  <LinkManager @accountId={{@model.accountId}} @billing={{@model.billing}} @links={{@model.links}} @domains={{@model.domains}} />
</template>
