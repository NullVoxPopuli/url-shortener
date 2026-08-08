import config from '#config';
import { Button, BrowserWindow } from 'nvp.ui';

const logoutUrl = config.apiOrigin + '/_/auth/logout';

<template>
  <section class="landing-shell">
    <header class="landing-header">
      <h1>Logout</h1>
      <p>End your current OAuth session.</p>
    </header>

    <BrowserWindow @url={{config.apiOrigin}} @shadow={{true}}>
      <div class="auth-actions">
        <a class="oauth-link" href={{logoutUrl}}>
          <Button @variant="secondary">Logout</Button>
        </a>
      </div>
    </BrowserWindow>
  </section>
</template>
