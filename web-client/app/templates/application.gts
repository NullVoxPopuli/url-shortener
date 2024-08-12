import { pageTitle } from 'ember-page-title';
import { StickyFooter } from 'ember-primitives';
import Route from 'ember-route-template';

import { Footer } from './components/footer';

export default Route(
  <template>
    {{pageTitle "nvp.gg"}}

    <StickyFooter>
      <:content>
        {{outlet}}
      </:content>

      <:footer>
        <Footer />
      </:footer>
    </StickyFooter>
  </template>
);

