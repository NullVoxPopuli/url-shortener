import { BrowserWindow, Button } from 'nvp.ui';
import config from '#config';

const githubLoginUrl = config.apiOrigin + '/_/auth/github';

<template>
  <section class="landing-shell">
    <header class="landing-header">
      <h1>Signup</h1>
      <p>Create your account with GitHub.</p>
    </header>

    <BrowserWindow @url={{config.apiOrigin}} @shadow={{true}}>
      <div class="auth-actions">
        <a class="oauth-link" href={{githubLoginUrl}}>
          <Button @variant="primary">Signup with GitHub</Button>
        </a>
      </div>
    </BrowserWindow>
  </section>
</template>
