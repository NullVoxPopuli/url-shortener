import Component from '@glimmer/component';
import { service } from '@ember/service';

import type CurrentUserService from '#services/current-user';

export default class HeaderAuthActions extends Component {
  @service declare currentUser: CurrentUserService;

  <template>
    {{#if this.currentUser.isAuthenticated}}
      <a href="/auth/logout">Logout</a>
      <span>{{this.currentUser.user.name}}</span>
    {{else}}
      <a href="/auth/login">Login</a>
      <a href="/auth/signup">Signup</a>
    {{/if}}
  </template>
}
