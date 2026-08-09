<template>
  <div class="page-shell">
    <h1>Users</h1>

    <section class="page-card surface">
      <p>Teammate management is coming soon. The Project plan includes 2
        teammates.</p>
    </section>
  </div>

  <style scoped>
    .page-shell {
      width: min(100%, 56rem);
      margin: 0 auto;
      display: grid;
      gap: var(--gap-4);
    }

    .page-shell h1 {
      margin: 0;
    }

    .page-card {
      margin: 0;
      padding: var(--padding-4) 1.5rem;
      border: var(--border-width) var(--border-style) var(--border-color);
      border-radius: var(--radius);
      background: var(--surface-background-color);
    }

    .page-card p {
      margin: 0;
    }
  </style>
</template>
