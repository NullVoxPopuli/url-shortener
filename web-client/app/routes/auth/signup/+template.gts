import { Button } from 'nvp.ui';

import config from '#config';

const githubLoginUrl = config.apiOrigin + '/_/auth/github';

<template>
  <main class="auth-page">
    <section class="auth-card surface">
      <div class="auth-heading">
        <h1>Signup</h1>
        <p>Create your account with GitHub.</p>
      </div>

      <div class="auth-actions">
        <a class="oauth-link" href={{githubLoginUrl}}>
          <Button @variant="primary">Signup with GitHub</Button>
        </a>
      </div>
    </section>
  </main>
</template>
