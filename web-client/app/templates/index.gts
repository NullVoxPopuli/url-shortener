import { Hero } from 'ember-primitives/layout/hero';
import Route from 'ember-route-template';

import { ShortenURLForm } from './components/form';

export default Route(
  <template>
    <Hero>
      <div class="hero-content">
        <h1>nvp.gg</h1>
        <em>The professional, API-first, user-friendly, URL shortener</em>

        <ShortenURLForm />
      </div>
    </Hero>

    <style>
      h1 {
        font-family: 'Arial';
        font-style: italic;
        text-decoration: underline;
      }
    </style>
  </template>
);

