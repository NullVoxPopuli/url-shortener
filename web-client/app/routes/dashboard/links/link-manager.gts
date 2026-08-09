import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { array, fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';

import { Request } from '@warp-drive/ember';
import { Button } from 'nvp.ui';

import { messageFrom } from '#app/data/errors';
import { createLink, deleteLink } from '#app/data/requests';

import { LinksTable } from '../links-table';

import type { Store } from '@warp-drive/core';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { BillingStatus, Link } from '#app/data/types';

function isWatermarked(billing: BillingStatus) {
  return !billing.hasActiveSubscription;
}

function isExhausted(billing: BillingStatus) {
  return billing.usage.remaining === 0;
}

function errorMessage(error: unknown) {
  return messageFrom(error);
}

interface Signature {
  Args: {
    billing: Future<ReactiveDataDocument<BillingStatus>>;
    links: Future<ReactiveDataDocument<Link[]>>;
  };
}

export default class LinkManager extends Component<Signature> {
  @service declare store: Store;

  @tracked isWorking = false;
  @tracked error: string | null = null;

  /**
   * Refreshing both requests keeps the table and the quota numbers in
   * sync after a mutation. The refresh functions come from the
   * <Request> components' content features.
   */
  create = async (refresh: Array<() => Promise<void>>, event: SubmitEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const value = new FormData(form).get('url');
    const url = typeof value === 'string' ? value.trim() : '';

    if (!url) return;

    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(createLink(url));
      await Promise.all(refresh.map((fn) => fn()));
      form.reset();
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  delete = async (refresh: Array<() => Promise<void>>, link: Link) => {
    if (!window.confirm(`Delete ${link.shortUrl}? This cannot be undone.`)) {
      return;
    }

    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(deleteLink(link.id));
      await Promise.all(refresh.map((fn) => fn()));
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  <template>
    <div class="page-shell">
      <h1>Links</h1>

      <Request @request={{@billing}}>
        <:loading>
          <p class="muted">Loading…</p>
        </:loading>

        <:error>
          <p class="warning">Could not load your account. Refresh to try
            again.</p>
        </:error>

        <:content as |billingDoc billingState|>
          <Request @request={{@links}}>
            <:loading>
              <p class="muted">Loading your links…</p>
            </:loading>

            <:error as |error|>
              <p class="warning">Could not load your links. Refresh to try
                again.</p>
              <p class="warning">{{errorMessage error}}</p>
            </:error>

            <:content as |linksDoc linksState|>
              {{#let
                (array billingState.refresh linksState.refresh)
                as |refresh|
              }}
                <section class="page-card surface">
                  <h2>Create a link</h2>

                  {{#if (isExhausted billingDoc.data)}}
                    <p class="warning">You've used your
                      {{billingDoc.data.plan.monthlyLinkLimit}}
                      links for this month.
                      <a href="/pricing">Upgrade for more.</a></p>
                  {{else}}
                    <form
                      class="create-form"
                      {{on "submit" (fn this.create refresh)}}
                    >
                      <label>
                        <span class="visually-hidden">Long URL</span>
                        <input
                          name="url"
                          placeholder="https://enter.a.long/url"
                          required
                        >
                      </label>
                      <Button
                        type="submit"
                        @variant="primary"
                        @disabled={{if this.isWorking "Working..."}}
                      >
                        Shorten
                      </Button>
                    </form>
                    {{#if billingDoc.data.usage.remaining}}
                      <p class="muted">{{billingDoc.data.usage.remaining}}
                        remaining this month</p>
                    {{/if}}
                  {{/if}}

                  {{#if this.error}}
                    <p class="warning">{{this.error}}</p>
                  {{/if}}
                </section>

                <section class="page-card surface">
                  <h2>Your links</h2>

                  <LinksTable
                    @links={{linksDoc.data}}
                    @watermark={{isWatermarked billingDoc.data}}
                    @onDelete={{fn this.delete refresh}}
                    @isDeleting={{this.isWorking}}
                  />
                </section>
              {{/let}}
            </:content>
          </Request>
        </:content>
      </Request>
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

      .page-card h2 {
        margin: 0 0 var(--gap-3);
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.7;
      }

      .page-card p {
        margin: var(--gap-2) 0 0;
      }

      .create-form {
        display: flex;
        gap: var(--gap-2);
      }

      .create-form label {
        flex: 1;
      }

      .create-form input {
        width: 100%;
        padding: 0.5rem 1rem;
        border-radius: var(--radius);
        border: var(--border-width) var(--border-style) var(--border-color);
        background: var(--color-page-background);
        color: var(--color-text);
      }

      .muted {
        opacity: 0.7;
      }

      .warning {
        color: var(--color-danger);
      }
    </style>
  </template>
}
