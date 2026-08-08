import { Button } from 'nvp.ui';

export const ShortenURLForm = <template>
  <form class="shorten-url-form">
    <label>
      <span class="visually-hidden">Long URL</span>
      <input
        placeholder="https://enter.a.long/url"
        name="url"
      >
    </label>
    <div class="submit-row">
      <Button
        type="submit"
        @variant="primary"
      >
        Shorten
      </Button>
    </div>
  </form>

  <style scoped>
    .shorten-url-form {
      display: grid;
      gap: 1rem;
      padding: 1rem;
      border-radius: 0.25rem;
      background: light-dark(#4856e7, #104784);
      backdrop-filter: blur(5px);
      filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
    }

    .shorten-url-form label {
      display: grid;
      gap: 1rem;
      font-weight: bold;
    }

    .shorten-url-form input {
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      border: 1px solid;
      background: white;
      color: black;
    }

    .shorten-url-form input::placeholder {
      color: #777;
    }

    .submit-row {
      display: flex;
      justify-content: flex-end;
    }
  </style>
</template>;
