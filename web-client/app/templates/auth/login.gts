import { Hero } from 'ember-primitives/layout/hero';
import Route from 'ember-route-template';

export default Route(
  <template>
    <Hero>
      <div class="hero-content">
        <h1>nvp.gg</h1>
        <em>The professional, <a href="https://docs.nvp.gg">API-first</a>, user-friendly, URL shortener</em>

        <button type="button">Login with Google</button>
        <button type="button">Login with GitHub</button>
      </div>
    </Hero>

    <style>
      h1 {
        font-family: 'Arial';
        font-style: italic;
        text-decoration: underline;
      }

      .hero-content em a {
        color: white;
      }
    </style>
  </template>
);

