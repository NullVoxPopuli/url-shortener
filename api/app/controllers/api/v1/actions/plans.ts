import { PLANS } from '#services/plans';

/**
 * The paid plan catalog. Public: the pricing page shows it before
 * anyone signs in, and it holds nothing about any account.
 */
export async function listPlans() {
  return {
    data: PLANS.map((plan) => ({
      type: 'plan',
      id: plan.key,
      attributes: { ...plan },
    })),
  };
}
