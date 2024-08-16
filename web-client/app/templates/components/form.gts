export const ShortenURLForm = <template>
  <form class="shorten-url-form">
    <label>
      <span class="visually-hidden">Long URL</span>
      <input
        placeholder="https://enter.a.long/url"
        name="url"
      >
    </label>
    <button type="submit">Shorten</button>
  </form>
</template>;
