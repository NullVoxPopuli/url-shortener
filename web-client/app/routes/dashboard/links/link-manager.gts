import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { service } from '@ember/service';

import { cacheKeyFor } from '@warp-drive/core';
import { Request } from '@warp-drive/ember';
import { EachLink, Paginate } from '@warp-drive/ember/experiments';
import { dataFromEvent } from 'ember-primitives/components/form';
import { Button } from 'nvp.ui';
import { Pagination } from 'nvp.ui/pagination';

import { messageFrom } from '#app/data/errors';
import { text } from '#app/data/form';
import { pageHints } from '#app/data/pagination';
import { createLink, deleteLink, updateLink } from '#app/data/requests';

import { LinksTable } from '../links-table.gts';

import type { LinkEditing } from '../links-table.gts';
import type { Store } from '@warp-drive/core';
import type { ReactiveDataDocument } from '@warp-drive/core/reactive';
import type { Future } from '@warp-drive/core/request';
import type { BillingStatus, CustomDomain, Link } from '#app/data/types';

function isWatermarked(billing: BillingStatus) {
  return !billing.hasActiveSubscription;
}

function isExhausted(billing: BillingStatus) {
  return billing.usage.remaining === 0;
}

function hasNoEdits(billing: BillingStatus) {
  return billing.plan.linkEditsPerMonth === 0;
}

function errorMessage(error: unknown) {
  return messageFrom(error);
}

function isPaged(totalPages: number) {
  return totalPages > 1;
}

/**
 * A page that has not loaded yet has no data; the table shows nothing
 * rather than crashing.
 */
function linksOn(page: { data: Link[] | null }) {
  return page.data ?? [];
}

interface Signature {
  Args: {
    accountId: string;
    billing: Future<ReactiveDataDocument<BillingStatus>>;
    links: Future<ReactiveDataDocument<Link[]>>;
    domains: Future<ReactiveDataDocument<CustomDomain[]>>;
  };
}

export default class LinkManager extends Component<Signature> {
  @service declare store: Store;

  @tracked isWorking = false;
  @tracked error: string | null = null;
  @tracked editingId: string | null = null;

  /**
   * Reading `editingId` here makes the table re-render on change.
   */
  editingFor = (billing: BillingStatus): LinkEditing => ({
    id: this.editingId,
    remaining: billing.usage.editsRemaining,
    canSetExpiration: billing.plan.linkExpiration,
    start: (link: Link) => {
      this.error = null;
      this.editingId = link.id;
    },
    cancel: () => {
      this.editingId = null;
    },
    save: (link: Link, editable: Link) => this.edit(link, editable),
  });

  edit = async (link: Link, editable: Link) => {
    const changed = this.store.cache.changedAttrs(cacheKeyFor(editable));

    if (Object.keys(changed).length === 0) {
      this.editingId = null;

      return;
    }

    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(updateLink(this.store, editable, this.args.accountId));
      this.editingId = null;
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  /**
   * Mutations invalidate the link and billing queries, and the
   * <Request> components reload them.
   */
  create = async (event: SubmitEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const data = dataFromEvent(event);
    const url = text(data.url);
    const domain = text(data.domain) || null;

    if (!url) return;

    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(createLink(this.store, { original: url, domain }, this.args.accountId));
      form.reset();
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  delete = async (link: Link) => {
    if (!window.confirm(`Delete ${link.shortUrl}? This cannot be undone.`)) {
      return;
    }

    this.isWorking = true;
    this.error = null;

    try {
      await this.store.request(deleteLink(link, this.args.accountId));
    } catch (error) {
      this.error = messageFrom(error);
    } finally {
      this.isWorking = false;
    }
  };

  <template>
    <div class="page-shell">
      <h1>Links</h1>

      <Request @request={{@billing}} @autorefresh="invalid">
        <:loading>
          <p class="muted">Loading…</p>
        </:loading>

        <:error>
          <p class="warning">Could not load your account. Refresh to try
            again.</p>
        </:error>

        <:content as |billingDoc|>
          <Paginate @request={{@links}} @pageHints={{pageHints}} @autorefresh="invalid">
            <:loading>
              <p class="muted">Loading your links…</p>
            </:loading>

            <:error as |error|>
              <p class="warning">Could not load your links. Refresh to try
                again.</p>
              <p class="warning">{{errorMessage error}}</p>
            </:error>

            <:content as |pages|>
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
                      {{on "submit" this.create}}
                    >
                      <label>
                        <span class="visually-hidden">Long URL</span>
                        <input
                          name="url"
                          placeholder="https://enter.a.long/url"
                          required
                        >
                      </label>
                      <Request @request={{@domains}} @autorefresh="invalid">
                        <:content as |domainsDoc|>
                          {{#if domainsDoc.data.length}}
                            <label>
                              <span class="visually-hidden">Domain</span>
                              <select name="domain">
                                <option value="">Default domain</option>
                                {{#each domainsDoc.data as |domain|}}
                                  <option
                                    value={{domain.hostname}}
                                  >{{domain.hostname}}</option>
                                {{/each}}
                              </select>
                            </label>
                          {{/if}}
                        </:content>
                      </Request>
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

                  {{#if (hasNoEdits billingDoc.data)}}
                    <p class="muted">Your plan does not include link edits.
                      <a href="/pricing">Upgrade to change destinations and
                        expirations.</a></p>
                  {{else if billingDoc.data.usage.editsRemaining}}
                    <p class="muted">{{billingDoc.data.usage.editsRemaining}}
                      link edits remaining this month</p>
                  {{else if billingDoc.data.plan.linkEditsPerMonth}}
                    <p class="warning">You've used your
                      {{billingDoc.data.plan.linkEditsPerMonth}}
                      link edits for this month.</p>
                  {{/if}}

                  {{#if pages.activePage}}
                    <LinksTable
                      @links={{linksOn pages.activePage}}
                      @watermark={{isWatermarked billingDoc.data}}
                      @onDelete={{this.delete}}
                      @isDeleting={{this.isWorking}}
                      @editing={{this.editingFor billingDoc.data}}
                    >
                      <:footer>
                        {{#if (isPaged pages.totalPages)}}
                          <span class="muted">Page
                            {{pages.activePage.pageNumber}}
                            of
                            {{pages.totalPages}}</span>
                          <EachLink @pages={{pages}} as |links|>
                            <Pagination @links={{links}} @label="Link pages" />
                          </EachLink>
                        {{/if}}
                      </:footer>
                    </LinksTable>
                  {{/if}}
                </section>
            </:content>
          </Paginate>
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

      .create-form label:first-child {
        flex: 1;
      }

      .create-form select {
        height: 100%;
        padding: 0.5rem 1rem;
        border-radius: var(--radius);
        border: var(--border-width) var(--border-style) var(--border-color);
        background: var(--color-page-background);
        color: var(--color-text);
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
