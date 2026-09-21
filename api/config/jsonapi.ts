import { defineConfig } from '@evoactivity/jsonapi-adonis';

export default defineConfig({
  /**
   * Resource classes customizing how models serialize. Models without a
   * resource class are auto-derived from Lucid metadata.
   */
  resources: [
    () => import('#resources/link_resource'),
    () => import('#resources/membership_resource'),
    () => import('#resources/invitation_resource'),
    () => import('#resources/visit_resource'),
    () => import('#resources/custom_domain_resource'),
    () => import('#resources/account_resource'),
    () => import('#resources/user_resource'),
  ],

  /**
   * Generate resource/relationship links from the named routes registered
   * via router.jsonApiResource(). Set to false to disable links entirely.
   */
  links: true,

  /**
   * Page size when the client paginates without an explicit page[size].
   */
  defaultPageSize: 20,

  /**
   * Accept client-generated ids on resource creation (403 when disabled).
   */
  allowClientIds: false,

  /**
   * When should errors render as JSON:API documents? By default requests
   * are detected automatically (jsonApiResource routes, or a client
   * speaking the JSON:API media type). Uncomment for prefix-based routing:
   */
  // errorDetection: (ctx) => ctx.request.url().startsWith('/api/'),
});
