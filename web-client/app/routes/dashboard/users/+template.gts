import TeamManager from './team-manager';

<template>
  {{! @glint-expect-error - route templates do not have typed @model }}
  <TeamManager @accountId={{@model.accountId}} @isAdmin={{@model.isAdmin}} @memberships={{@model.memberships}} @invitations={{@model.invitations}} />
</template>
