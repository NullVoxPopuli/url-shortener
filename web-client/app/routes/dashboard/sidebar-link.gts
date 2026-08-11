import Component from '@glimmer/component';
import { service } from '@ember/service';

import type RouterService from '@ember/routing/router-service';

interface Signature {
  Element: HTMLAnchorElement;
  Args: {
    href: string;
  };
  Blocks: {
    default: [];
  };
}

/**
 * A sidebar anchor that marks itself `aria-current="page"` when the
 * current URL matches — which is what NavigationList's highlight
 * styling keys off of.
 */
export class SidebarLink extends Component<Signature> {
  @service declare router: RouterService;

  get isActive() {
    return this.router.currentURL === this.args.href;
  }

  <template>
    <a
      href={{@href}}
      aria-current={{if this.isActive "page"}}
      ...attributes
    >{{yield}}</a>
  </template>
}
