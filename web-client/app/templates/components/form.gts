import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { service } from '@ember/service';

import { Button } from 'nvp.ui';

import { createLink } from '#app/data/requests';

import type { Store } from '@warp-drive/core';

function messageFrom(error: unknown): string {
  if (error && typeof error === 'object') {
    const maybe = error as {
      errors?: Array<{ title?: string; detail?: string }>;
      message?: string;
    };
    const first = maybe.errors?.[0];

    if (first?.detail ?? first?.title) return first.detail ?? first.title ?? '';
    if (maybe.message) return maybe.message;
  }

  return 'Something went wrong. Try again.';
}

export class ShortenURLForm extends Component {
  @service declare store: Store;

  @tracked isSubmitting = false;
  @tracked shortUrl: string | null = null;
  @tracked error: string | null = null;

  submit = async (event: SubmitEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const value = new FormData(form).get('url');
    const url = typeof value === 'string' ? value.trim() : '';

    if (!url) return;

    this.isSubmitting = true;
    this.error = null;
    this.shortUrl = null;

    try {
      const result = await this.store.request(createLink(url));

      this.shortUrl = result.content.data?.shortUrl ?? null;
      form.reset();
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isSubmitting = false;
    }
  };

  copy = () => {
    if (this.shortUrl) {
      void navigator.clipboard.writeText(this.shortUrl);
    }
  };

  <template>
    <form class="shorten-url-form" {{on "submit" this.submit}}>
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
          @disabled={{if this.isSubmitting "Shortening..."}}
        >
          Shorten
        </Button>
      </div>

      {{#if this.shortUrl}}
        <p class="shorten-result">
          <a href={{this.shortUrl}} target="_blank" rel="noopener noreferrer">
            {{this.shortUrl}}
          </a>
          <Button @onClick={{this.copy}}>Copy</Button>
        </p>
      {{/if}}

      {{#if this.error}}
        <p class="shorten-error">{{this.error}}</p>
      {{/if}}
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

      .shorten-result {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .shorten-result a {
        color: white;
      }

      .shorten-error {
        margin: 0;
        color: white;
        font-weight: bold;
      }
    </style>
  </template>
}
