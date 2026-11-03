import type Account from '#models/account';
import { INTERNAL_PLAN, NO_SUBSCRIPTION_PLAN, PLANS } from './plans.js';

export const OVERRIDABLE_PLAN_KEYS = [
  ...PLANS.map((plan) => plan.key),
  INTERNAL_PLAN.key,
  NO_SUBSCRIPTION_PLAN.key,
];

/**
 * Directly set an account's plan, bypassing Stripe. Staff tooling
 * only (`node ace plan:set`) — normal plan changes go through
 * checkout/webhooks so Stripe stays the source of truth.
 */
export async function overridePlan(account: Account, planKey: string) {
  const paid = PLANS.find((plan) => plan.key === planKey);

  if (paid) {
    account.isInternal = false;
    account.stripePriceId = paid.prices.month.id;
    account.stripeSubscriptionStatus = 'active';
  } else if (planKey === INTERNAL_PLAN.key) {
    account.isInternal = true;
    account.stripePriceId = null;
    account.stripeSubscriptionStatus = null;
  } else if (planKey === NO_SUBSCRIPTION_PLAN.key) {
    account.isInternal = false;
    account.stripePriceId = null;
    account.stripeSubscriptionStatus = null;
  } else {
    throw new Error(`Unknown plan "${planKey}". Valid plans: ${OVERRIDABLE_PLAN_KEYS.join(', ')}`);
  }

  await account.save();

  return account;
}
