import './styles.css';

import { on } from '@ember/modifier';

import { pageTitle } from 'ember-page-title';
import { StickyFooter } from 'ember-primitives';
import { Header as NvpHeader, Shell, ThemeToggle } from 'nvp.ui';

import { Footer } from './footer';
import HeaderAuthActions from './header-auth-actions';
import HeaderLinks from './header-links';

function handleScroll(event: Event) {
  const scrollContainer = event.currentTarget as HTMLElement;
  const header = scrollContainer.querySelector('.nvp__header');

  header?.classList.toggle('did-scroll', scrollContainer.scrollTop > 0);
}

<template>
  <Shell>
    {{pageTitle "nvp.gg"}}

    <StickyFooter {{on "scroll" handleScroll}}>
      <:content>
        <style>
          @scope {
            a { color: white; }
            span { color: white; }
          }
        </style>
        <NvpHeader class="home-header" @position="top">
          <:left>
            <HeaderLinks />
          </:left>
          <:right>
            <HeaderActions />
          </:right>
        </NvpHeader>
        {{outlet}}
      </:content>

      <:footer>
        <Footer />
      </:footer>
    </StickyFooter>
  </Shell>
</template>

const HeaderActions = <template>
  <HeaderAuthActions />
  <ThemeToggle />
</template>;
