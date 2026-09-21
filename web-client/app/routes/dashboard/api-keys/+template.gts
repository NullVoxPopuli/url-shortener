import ApiKeyManager from './api-key-manager.gts';

<template>
  {{! @glint-expect-error - route templates do not have typed @model }}
  <ApiKeyManager @accountId={{@model.accountId}} @apiKeys={{@model.apiKeys}} />
</template>
