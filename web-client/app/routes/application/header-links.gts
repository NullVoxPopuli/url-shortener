import Component from '@glimmer/component';
import { service } from '@ember/service';

import config from '#config';

import type CurrentUserService from '#services/current-user';

const docsOrigin = config.docsOrigin;

interface Signature {
  Args: {
    /**
     * In the dashboard's ApplicationShell, Home/Dashboard live in the
     * sidebar instead of the header.
     */
    hideAppLinks?: boolean;
  };
}

export default class HeaderLinks extends Component<Signature> {
  @service declare currentUser: CurrentUserService;

  <template>
    {{#unless @hideAppLinks}}
      {{#if this.currentUser.isAuthenticated}}
        <a href="/">Home</a>
        <span aria-hidden="true">|</span>
        <a href="/dashboard">Dashboard</a>
        <span aria-hidden="true">|</span>
      {{/if}}
    {{/unless}}
    <a href={{docsOrigin}}>API Documentation</a>
    <span aria-hidden="true">|</span>
    <a href="/pricing">Pricing</a>
  </template>
}
