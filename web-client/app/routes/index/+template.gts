import { Hero } from 'ember-primitives/layout/hero';

import config from '#config';

import { SiteChrome } from '../application/site-chrome';
import { ShortenURLForm } from './form';

const docsOrigin = config.docsOrigin;

<template>
  <SiteChrome>
    <Hero>
    <div class="hero-content">
      <h1>nvp.gg</h1>
      <em>The professional, <a href={{docsOrigin}}>API-first</a>, user-friendly, URL shortener</em>

      <ShortenURLForm />

      <em>5.3×10<sup>36</sup>&nbsp;(5.3 undecillion) Possible Links</em>
    </div>
    </Hero>
  </SiteChrome>

  <style scoped>
    .hero-content {
      display: grid;
      gap: 1rem;
      margin-bottom: 80px;
      padding: 0.5rem;
    }

    .hero-content h1 {
      margin: 0;
      font-size: 3rem;
      color: white;
    }

    .hero-content em {
      color: white;
    }

    .hero-content em a {
      color: white;
    }
  </style>
</template>
