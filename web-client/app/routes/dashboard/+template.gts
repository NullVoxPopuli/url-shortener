import Dashboard from './dashboard';

<template>
  {{! @glint-expect-error - route templates do not have typed @model }}
  <Dashboard @billing={{@model.billing}} @links={{@model.links}} />
</template>
