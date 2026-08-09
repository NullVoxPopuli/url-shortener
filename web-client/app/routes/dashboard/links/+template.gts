import LinkManager from './link-manager';

<template>
  {{! @glint-expect-error - route templates do not have typed @model }}
  <LinkManager @billing={{@model.billing}} @links={{@model.links}} />
</template>
