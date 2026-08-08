import './styles.css';

import { on } from '@ember/modifier';

import { pageTitle } from 'ember-page-title';
import { StickyFooter } from 'ember-primitives';
import { Header as NvpHeader, Shell, ThemeToggle } from 'nvp.ui';

import config from '#config';

import { Footer } from './components/footer';

const docsOrigin = config.docsOrigin;

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

const HeaderLinks = <template>
  <a href={{docsOrigin}}>API Documentation</a>
  <span aria-hidden="true">|</span>
  <a href={{docsOrigin}}>Pricing</a>
</template>;

const HeaderActions = <template>
  <a href="/auth/login">Login</a>
  <a href="/auth/signup">Signup</a>
  <ThemeToggle />
</template>;
