import Component from '@glimmer/component';
import { service } from '@ember/service';

import config from '#config';
import type CurrentUserService from '#services/current-user';

const docsOrigin = config.docsOrigin;

export default class HeaderLinks extends Component {
  @service declare currentUser: CurrentUserService;

  <template>
    {{#if this.currentUser.isAuthenticated}}
      <a href="/">Home</a>
      <span aria-hidden="true">|</span>
      <a href="/dashboard">Dashboard</a>
      <span aria-hidden="true">|</span>
    {{/if}}
    <a href={{docsOrigin}}>API Documentation</a>
    <span aria-hidden="true">|</span>
    <a href={{docsOrigin}}>Pricing</a>
  </template>
}
