/**
 * @param {import('fastify').FastifyInstance} f
 */
export function setupSubscriptions(f) {
  f.decorate("verifyCanCreateLink", function (request, reply, done) {
    // Not implemented yet -- need Stripe integration
    // Requireds to be logged in and authenticated before (so we have a user to grab)
    // Free accounts:
    // - 1 link a month
    //
    // Things to be sure to mention in pricing:
    // - Unlimited Clicks
    // - Click tracking
    // - API Access
    // - cheaper than
    //   - https://t.ly
    //   - https://bitly.com/pages/pricing
    //   - https://www.rebrandly.com/pricing
    //   - https://dub.co/pricing
    //   - https://tinyurl.com/app/pricing
    //   - https://www.bl.ink/pricing
    //   - https://short.io/pricing
    //
    // Features to add:
    // - Analytics (for 5$/month ?)
    // - Unlimited QR Code generation
    // - Custom short URLs (maybe only for $10/month +?)
    // - Multiple Users (shared plan / payment?)
    // - Editing Links
    //   - Expiring Links
    //   - Password Protection
    //   - Namespace / folder
    //     - 404, 301, etc
    // - Import from CSV
    done();
  });
}
