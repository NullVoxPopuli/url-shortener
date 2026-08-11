import config from '#config';

/**
 * Checkout + portal are "leave the app" actions: they POST to the API,
 * then redirect the whole window to Stripe. No data lands in the cache,
 * so these are plain fetches rather than store requests.
 */
async function redirectToStripe(path: string, body?: string) {
  const response = await fetch(`${config.apiOrigin}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    body,
  });

  if (!response.ok) throw new Error(`Request to ${path} failed: ${response.status}`);

  const result = (await response.json()) as { data?: { attributes?: { url?: unknown } } };
  const url = result.data?.attributes?.url;

  if (typeof url !== 'string') throw new Error(`${path} did not return a URL`);

  window.location.assign(url);
}

export async function startCheckout(planKey: string) {
  await redirectToStripe('/v1/billing/checkout', JSON.stringify({ plan: planKey }));
}

export async function openBillingPortal() {
  await redirectToStripe('/v1/billing/portal');
}
