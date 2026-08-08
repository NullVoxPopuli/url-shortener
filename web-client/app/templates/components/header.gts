import config from '#config';

const docsOrigin = config.docsOrigin;

export const Header = <template>
  <header class="site-header">
    <div class="left">
      <a href={{docsOrigin}}>API Documentation</a>
      <span aria-hidden="true">|</span>
      <a href={{docsOrigin}}>Pricing</a>
    </div>

    <div class="right">
      <a class="login" href="/auth/login">Login</a>
      <a class="signup" href="/auth/signup">Signup</a>
    </div>
  </header>

  <style scoped>
    .site-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 1rem;
      z-index: 10;
      display: grid;
      grid-auto-flow: column;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    }

    .left {
      color: white;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .left a {
      color: white;
      text-decoration: none;
      padding: 0.125rem 0.25rem;
    }

    .left a:hover {
      text-decoration: underline;
    }

    .left span[aria-hidden] {
      color: white;
    }

    .right {
      display: flex;
      gap: 1rem;
    }

    .right a {
      display: inline-block;
      text-decoration: none;
      background: white;
      color: black;
      border: 1px solid;
      border-radius: 0.25rem;
      padding: 0.5rem 1rem;
    }

    .right a:hover {
      background: #eee;
      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.4);
    }
  </style>
</template>;
