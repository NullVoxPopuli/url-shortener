import { Button } from 'nvp.ui';

import config from '#config';

const githubLoginUrl = config.authOrigin + '/_/auth/github';

<template>
  <main class="auth-page">
    <section class="auth-card surface">
      <div class="auth-heading">
        <h1>Login</h1>
        <p>Continue with GitHub to access billing and account-managed links.</p>
      </div>

      <div class="auth-actions">
        <a class="oauth-link" href={{githubLoginUrl}}>
          <Button @variant="primary">Login with GitHub</Button>
        </a>
      </div>
    </section>
  </main>
</template>
