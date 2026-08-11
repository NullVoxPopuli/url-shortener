import './styles.css';

import { pageTitle } from 'ember-page-title';
import { PortalTargets } from 'ember-primitives';

<template>
  {{pageTitle "nvp.gg"}}

  {{! popovers/menus/tooltips render into these }}
  <PortalTargets />

  {{outlet}}
</template>
