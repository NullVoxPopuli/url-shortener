import { on } from '@ember/modifier';

import { StickyFooter } from 'ember-primitives';
import { Header as NvpHeader, Shell, ThemeToggle } from 'nvp.ui';

import { Footer } from './footer';
import HeaderAuthActions from './header-auth-actions';
import HeaderLinks from './header-links';

import type { TOC } from '@ember/component/template-only';

function handleScroll(event: Event) {
  const scrollContainer = event.currentTarget as HTMLElement;
  const header = scrollContainer.querySelector('.nvp__header');

  header?.classList.toggle('did-scroll', scrollContainer.scrollTop > 0);
}

interface Signature {
  Blocks: {
    default: [];
  };
}

/**
 * The public-site layout: hero-style header + sticky footer.
 * The logged-in area uses ApplicationShell instead
 * (see routes/dashboard/+template.gts).
 */
export const SiteChrome: TOC<Signature> = <template>
  <Shell>
    <StickyFooter {{on "scroll" handleScroll}}>
      <:content>
        <style>
          @scope {
            a { color: white; }
            span { color: white; }
          }
        </style>
        <NvpHeader class="home-header" @position="top">
          <:left>
            <HeaderLinks />
          </:left>
          <:right>
            <HeaderAuthActions />
            <ThemeToggle />
          </:right>
        </NvpHeader>
        {{yield}}
      </:content>

      <:footer>
        <Footer />
      </:footer>
    </StickyFooter>
  </Shell>
</template>;
