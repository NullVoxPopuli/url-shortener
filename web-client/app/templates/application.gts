import './styles.css';

import { pageTitle } from 'ember-page-title';
import { StickyFooter } from 'ember-primitives';

import { Footer } from './components/footer';

<template>
  {{pageTitle "nvp.gg"}}

  <StickyFooter>
    <:content>
      {{outlet}}
    </:content>

    <:footer>
      <Footer />
    </:footer>
  </StickyFooter>
</template>

