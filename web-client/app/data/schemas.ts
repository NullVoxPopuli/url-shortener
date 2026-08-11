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
      { kind: 'field', name: 'domain' },
      { kind: 'field', name: 'original' },
      { kind: 'field', name: 'visits' },
      { kind: 'field', name: 'createdAt' },
      { kind: 'field', name: 'updatedAt' },
      { kind: 'field', name: 'expiresAt' },
      {
        kind: 'belongsTo',
        name: 'ownedBy',
        type: 'account',
        options: { async: false, inverse: null, linksMode: true },
      },
      {
        kind: 'belongsTo',
        name: 'createdBy',
        type: 'user',
        options: { async: false, inverse: null, linksMode: true },
      },
    ],
  }),
  withDefaults({
    type: 'account',
    fields: [
      { kind: 'field', name: 'name' },
      { kind: 'field', name: 'isFree' },
      { kind: 'field', name: 'createdAt' },
      { kind: 'field', name: 'updatedAt' },
      {
        kind: 'belongsTo',
        name: 'admin',
        type: 'user',
        options: { async: false, inverse: null, linksMode: true },
      },
    ],
  }),
  withDefaults({
    type: 'user',
    fields: [
      { kind: 'field', name: 'name' },
      { kind: 'field', name: 'createdAt' },
      { kind: 'field', name: 'updatedAt' },
      {
        kind: 'belongsTo',
        name: 'account',
        type: 'account',
        options: { async: false, inverse: null, linksMode: true },
      },
    ],
  }),
  withDefaults({
    type: 'membership',
    fields: [
      { kind: 'field', name: 'role' },
      { kind: 'field', name: 'createdAt' },
      {
        kind: 'belongsTo',
        name: 'user',
        type: 'user',
        options: { async: false, inverse: null, linksMode: true },
      },
      {
        kind: 'belongsTo',
        name: 'account',
        type: 'account',
        options: { async: false, inverse: null, linksMode: true },
      },
    ],
  }),
  withDefaults({
    type: 'custom-domain',
    fields: [
      { kind: 'field', name: 'hostname' },
      { kind: 'field', name: 'createdAt' },
      {
        kind: 'belongsTo',
        name: 'account',
        type: 'account',
        options: { async: false, inverse: null, linksMode: true },
      },
    ],
  }),
  withDefaults({
    type: 'api-key',
    fields: [
      { kind: 'field', name: 'name' },
      { kind: 'array', name: 'scopes' },
      { kind: 'field', name: 'token' },
      { kind: 'field', name: 'createdAt' },
      { kind: 'field', name: 'lastUsedAt' },
      { kind: 'field', name: 'expiresAt' },
    ],
  }),
  withDefaults({
    type: 'invitation',
    fields: [
      { kind: 'field', name: 'role' },
      { kind: 'field', name: 'token' },
      { kind: 'field', name: 'acceptUrl' },
      { kind: 'field', name: 'createdAt' },
      { kind: 'field', name: 'expiresAt' },
      { kind: 'field', name: 'acceptedAt' },
      {
        kind: 'belongsTo',
        name: 'account',
        type: 'account',
        options: { async: false, inverse: null, linksMode: true },
      },
    ],
  }),
];
