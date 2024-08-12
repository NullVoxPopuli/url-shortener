export const ShortenURLForm = <template>
  <form class="shorten-url-form">
    <label>
      <span>Long URL</span>
      <input name="url">
    </label>
    <button type="submit">Shorten</button>
  </form>

  <style>
    .shorten-url-form {
       display: grid;
       gap: 1rem;
    }

    .shorten-url-form label {
      display: grid;
      gap: 1rem;
    }
  </style>
</template>;
