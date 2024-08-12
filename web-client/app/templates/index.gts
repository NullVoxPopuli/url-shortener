import Route from 'ember-route-template';

import { ShortenURLForm } from './components/form';

export default Route(
  <template>
    <h1>nvp.gg</h1>
    <em>The professional, API-first, user-friendly, URL shortener</em>

    <ShortenURLForm />

    <style>
      h1 {
        font-family: 'Arial';
        font-style: italic;
        text-decoration: underline;
      }
    </style>
  </template>
);

