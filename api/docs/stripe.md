# Stripe: local development & testing

## One-time setup with your own Stripe account

1. Create a **sandbox** (Stripe dashboard → top-left account picker → "Create sandbox").
   Sandboxes are disposable: deleting one deletes all of its data, and you can have
   up to five — so you can wipe billing state at any time by deleting and recreating
   the sandbox, then re-running the seed command below.
2. Grab the sandbox **secret key** (Developers → API keys → `sk_test_...`) and put it
   in `api/.env.development`:

   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   ```

3. Create the product/price and get your `STRIPE_PRICE_ID` — don't click it together
   in the dashboard; let the seed command own it (idempotent, survives sandbox wipes):

   ```bash
   cd api
   node ace stripe:seed
   # ...prints: STRIPE_PRICE_ID=price_... → paste into .env.development
   ```

4. Forward webhooks to your local API with the Stripe CLI (`stripe login` first,
   choosing the sandbox):

   ```bash
   stripe listen --forward-to https://api.nvp.local:5001/stripe/webhook --skip-verify
   ```

   `stripe listen` prints a `whsec_...` signing secret → set it as
   `STRIPE_WEBHOOK_SECRET` in `api/.env.development` and restart the API.

5. In the sandbox dashboard, enable **Settings → Checkout & Payment Links →
   Subscriptions → "Limit customers to one subscription"**. This is the only
   real guard against double-checkout races (two open checkout tabs).

## Testing the flow by hand

1. Log into the app, then `POST /v1/billing/checkout` (the web client's upgrade
   button, or curl with your session cookie). Open the returned `url`.
2. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC.
3. You'll be redirected through `/v1/billing/success` (which syncs eagerly —
   no waiting on webhooks) back to the app.
4. `GET /v1/billing/status` should now show `hasActiveSubscription: true`.
5. `POST /v1/billing/portal` → open the returned `url` to cancel/manage;
   webhook events keep the local row in sync.

Other useful test cards: `4000 0000 0000 9995` (declined),
`4000 0025 0000 3155` (requires 3DS). See https://docs.stripe.com/testing

## Recreating test data (after wiping the DB or the sandbox)

```bash
cd api
node ace stripe:seed                 # ensures product + price, lists accounts
node ace stripe:seed --account=<id>  # gives that account an active subscription
```

The command is **idempotent** — every step is get-or-create, so it's safe to run
repeatedly, against a fresh sandbox, or after `migration:fresh`:

- the product uses a fixed id (`prod_url_shortener_dev`)
- the price is found via `lookup_key` (`url_shortener_monthly`) — Stripe's
  recommended stable handle, since prices can't have client-chosen ids
- the customer comes from the account's stored `stripe_customer_id` (or is
  created via the same code path checkout uses)
- the subscription is only created if no active one exists for that price,
  paid with the `pm_card_visa` test payment method
- it refuses to run against a non-test key

Why not Stripe CLI fixtures or `Idempotency-Key`? Fixtures replay raw POSTs, so
re-runs create duplicates; idempotency keys are pruned after ~24 hours, so they
only dedupe same-day retries. Get-or-create against stable handles is the only
approach that stays idempotent forever.

To simulate renewals/failed payments over time, use
[test clocks](https://docs.stripe.com/billing/testing/test-clocks) — but note
clock-attached customers are deleted with their clock, so they're intentionally
not part of the seed.
