import { SiteChrome } from '../application/site-chrome';

<template>
  <SiteChrome>
    <main class="join-page">
      <section class="join-card surface">
        {{! @glint-expect-error - route templates do not have typed @model }}
        {{#if @model.ok}}
          <h1>Welcome aboard</h1>
          {{! @glint-expect-error - route templates do not have typed @model }}
          <p>You've joined <strong>{{@model.accountName}}</strong>.</p>
          <p>Use the account switcher in the dashboard to hop between your
            accounts.</p>
          <p><a href="/dashboard">Go to the dashboard</a></p>
        {{else}}
          <h1>That didn't work</h1>
          {{! @glint-expect-error - route templates do not have typed @model }}
          <p>{{@model.error}}</p>
          <p>Ask for a fresh invitation link, then try again.</p>
        {{/if}}
      </section>
    </main>
  </SiteChrome>

  <style scoped>
    .join-page {
      min-height: calc(100dvh - 3.5rem);
      padding: 5rem 1rem 2rem;
      display: grid;
      justify-content: center;
      align-content: start;
    }

    .join-card {
      width: min(100%, 32rem);
      padding: 2rem;
      border-radius: var(--radius);
      background: var(--surface-background-color);
      color: var(--color-text);
    }

    .join-card h1 {
      margin-top: 0;
    }
  </style>
</template>
