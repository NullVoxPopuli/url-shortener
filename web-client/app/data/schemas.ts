import { withDefaults } from '@warp-drive/core/reactive';

export const SCHEMAS = [
  withDefaults({
    type: 'billing-status',
    fields: [
      { kind: 'field', name: 'isFree' },
      { kind: 'field', name: 'hasActiveSubscription' },
      { kind: 'object', name: 'stripe' },
      { kind: 'object', name: 'plan' },
      { kind: 'object', name: 'usage' },
      { kind: 'array', name: 'availablePlans' },
      { kind: 'object', name: 'paymentMethod' },
      { kind: 'field', name: 'lastSyncedAt' },
    ],
  }),
  withDefaults({
    type: 'link',
    fields: [
      { kind: 'field', name: 'shortUrl' },
      { kind: 'field', name: 'visits' },
      { kind: 'field', name: 'createdAt' },
      { kind: 'field', name: 'updatedAt' },
      { kind: 'field', name: 'expiresAt' },
    ],
  }),
];
