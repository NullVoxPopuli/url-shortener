import DomainManager from './domain-manager';

<template>
  {{! @glint-expect-error - route templates do not have typed @model }}
  <DomainManager @isAdmin={{@model.isAdmin}} @domains={{@model.domains}} />
</template>
