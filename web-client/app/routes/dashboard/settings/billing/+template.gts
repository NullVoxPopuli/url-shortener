import BillingSettings from './billing-settings.gts';

<template>
  <BillingSettings
    {{! @glint-expect-error - route templates do not have typed @model }}
    @isAdmin={{@model.isAdmin}}
    {{! @glint-expect-error - route templates do not have typed @model }}
    @billing={{@model.billing}}
    {{! @glint-expect-error - route templates do not have typed @model }}
    @history={{@model.history}}
  />
</template>
