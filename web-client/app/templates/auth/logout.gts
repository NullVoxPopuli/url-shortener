import { Button } from 'nvp.ui';

import config from '#config';

const logoutUrl = config.apiOrigin + '/_/auth/logout';

<template>
  <main class="auth-page">
    <section class="auth-card surface">
      <div class="auth-heading">
        <h1>Logout</h1>
        <p>End your current OAuth session.</p>
      </div>

      <div class="auth-actions">
        <a class="oauth-link" href={{logoutUrl}}>
          <Button @variant="secondary">Logout</Button>
        </a>
      </div>
    </section>
  </main>
</template>
