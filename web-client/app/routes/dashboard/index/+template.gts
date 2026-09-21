import Dashboard from './dashboard.gts';

<template>
  {{! @glint-expect-error - route templates do not have typed @model }}
  <Dashboard
    @accountSlug={{@model.accountSlug}}
    @billing={{@model.billing}}
    @links={{@model.links}}
  />
</template>
