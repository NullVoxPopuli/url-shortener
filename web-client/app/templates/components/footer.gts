import { ExternalLink } from 'ember-primitives/components/external-link';

export const Footer = <template>
  <footer>
    Coming from g.co (shutdown on <GCoShutdown />)?
    (aka <FirebaseDynamicLinks />)

  </footer>
</template>;

const GCoShutdown = <template>
  <ExternalLink href="https://developers.googleblog.com/en/google-url-shortener-links-will-no-longer-be-available/">
    August 25, 2025
  </ExternalLink>
</template>;

const FirebaseDynamicLinks = <template>
  <ExternalLink href="https://firebase.google.com/docs/dynamic-links/">
    Firebase Dynamic Links
  </ExternalLink>
</template>;
