import Component from '@glimmer/component';
import { service } from '@ember/service';

import config from '#config';
import type CurrentUserService from '#services/current-user';

const logoutUrl = config.authOrigin + '/_/auth/logout';

export default class HeaderAuthActions extends Component {
  @service declare currentUser: CurrentUserService;

  <template>
    {{#if this.currentUser.isAuthenticated}}
      <a href={{logoutUrl}}>Logout</a>
      <span>{{this.currentUser.user.name}}</span>
    {{else}}
      <a href="/auth/login">Login</a>
      <a href="/auth/signup">Signup</a>
    {{/if}}
  </template>
}
