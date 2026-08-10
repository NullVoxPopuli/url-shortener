import { mimeType } from '#jsonapi';
import { componentSchemaRef, dynamicSegment, jsonapiRef } from '#openapi';
import type { OpenAPIObject } from 'openapi3-ts/oas31';

/**
 * Account-scoped endpoints operate on this account (one you belong
 * to); without it, your personal account is used.
 */
const accountParam = {
  name: 'accountId',
  in: 'query' as const,
  required: false,
  schema: { type: 'string' as const, format: 'uuid' },
  description:
    'The account to operate on — any account you belong to. Defaults to your personal account.',
};

/**
 * Compound-document sideloading, per the spec: nothing is included
 * unless asked for. Unknown paths are a 400.
 */
const includeParam = (paths: string) => ({
  name: 'include',
  in: 'query' as const,
  required: false,
  schema: { type: 'string' as const },
  description: `Comma-separated relationship paths to sideload into \`included\` (e.g. \`${paths}\`). Unknown paths are a 400.`,
});

const V1: Omit<OpenAPIObject, 'info' | 'openapi'> = {
  paths: {
    '/v1/links': {
      get: {
        summary: 'List links',
        description:
          "Lists the account's links. Accepts an API key with the `links:read` scope. Supports `sort` (e.g. `-createdAt`), `page[number]`/`page[size]`, and `fields[link]` sparse fieldsets.",
        security: [{ apiKey: [] }],
        parameters: [accountParam, includeParam('ownedBy,createdBy')],
        responses: {
          200: {
            description: 'Success',
            content: {
              [mimeType]: {
                schema: {
                  type: 'object',
                  properties: {
                    links: { type: 'object' },
                    data: { type: 'array', items: componentSchemaRef('Link') },
                  },
                },
              },
            },
          },
          401: componentSchemaRef('Unauthenticated'),
          415: componentSchemaRef('UnsupportedMediaType'),
        },
      },
      post: {
        summary: 'Create links',
        description:
          'Creates a short link on the account. Body is a { json:api } resource document: { "data": { "type": "link", "attributes": { "original": "https://...", "domain": "optional-custom-domain" } } }. Accepts an API key with the `links:write` scope.',
        security: [{ apiKey: [] }],
        parameters: [accountParam, includeParam('ownedBy,createdBy')],
      },
    },
    '/v1/links/{id}': {
      get: {
        summary: 'Show link',
        description:
          "Shows one of the account's links. Accepts an API key with the `links:read` scope.",
        security: [{ apiKey: [] }],
        parameters: [dynamicSegment('id'), accountParam, includeParam('ownedBy,createdBy')],
        responses: {
          200: {
            description: 'OK',
            content: {
              [mimeType]: {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      $ref: jsonapiRef('definitions/resource'),
                    },
                    included: {
                      $ref: jsonapiRef('definitions/included'),
                    },
                  },

                  example: {
                    data: {
                      attributes: {
                        originalURL: 'https://bah',
                      },
                    },
                    included: [],
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        parameters: [dynamicSegment('id'), accountParam],
        summary: 'Delete link',
        description:
          "Deletes one of the account's links. 404 when there is nothing to delete. Accepts an API key with the `links:write` scope.",
        security: [{ apiKey: [] }],
      },
    },
    '/v1/links/{id}/visits': {
      get: {
        summary: 'List visits for a link',
        description:
          'Lists recorded visits ("clicks") for one of the account\'s links, most recent first. Each visit records when it happened, the referrer, and the user agent. Accepts an API key with the `links:read` scope.',
        security: [{ apiKey: [] }],
        parameters: [dynamicSegment('id'), accountParam],
        responses: {
          200: {
            description: 'Success',
            content: {
              [mimeType]: {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: jsonapiRef('definitions/resource') } },
                  },
                  example: {
                    data: [
                      {
                        type: 'visit',
                        id: '1',
                        attributes: {
                          visitedAt: '2026-08-09T14:00:00.000Z',
                          referrer: 'https://example.com/',
                          userAgent: 'Mozilla/5.0 (...)',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          401: componentSchemaRef('Unauthenticated'),
          404: componentSchemaRef('NotFound'),
          415: componentSchemaRef('UnsupportedMediaType'),
        },
      },
    },
    '/v1/accounts': {
      post: {
        summary: 'Create an additional account',
        description:
          'Creates an additional (non-personal) account with you as admin. Body is a { json:api } resource document: { "data": { "type": "account", "attributes": { "name": "..." } } }. Gated by your personal account\'s plan: side-hobby 1, hobby 2, project 3, unpaid 0 (402 when full).',
      },
    },
    '/v1/accounts/{id}': {
      get: {
        summary: 'Show account',
        description:
          "Shows your authenticated user's account. Other accounts are not visible. Billing details are not included here — see the billing endpoints.",
        parameters: [dynamicSegment('id')],
        responses: {
          200: {
            description: 'OK',
            content: {
              [mimeType]: {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: jsonapiRef('definitions/resource') },
                    included: { $ref: jsonapiRef('definitions/included') },
                  },
                  example: {
                    data: {
                      type: 'account',
                      id: 'uuid',
                      attributes: { name: 'Acme', isFree: false },
                    },
                    included: [],
                  },
                },
              },
            },
          },
          401: componentSchemaRef('Unauthenticated'),
          404: componentSchemaRef('NotFound'),
          415: componentSchemaRef('UnsupportedMediaType'),
        },
      },
    },
    '/v1/accounts/{id}/memberships': {
      get: {
        summary: 'List account members',
        description: 'Lists the members of an account you belong to.',
        parameters: [dynamicSegment('id'), includeParam('user,account.admin')],
        responses: {
          401: componentSchemaRef('Unauthenticated'),
          404: componentSchemaRef('NotFound'),
          415: componentSchemaRef('UnsupportedMediaType'),
        },
      },
    },
    '/v1/accounts/{id}/invitations': {
      get: {
        summary: 'List pending invitations',
        description: 'Lists pending invitations (account admins only).',
        parameters: [dynamicSegment('id'), includeParam('account.admin')],
        responses: {
          401: componentSchemaRef('Unauthenticated'),
          404: componentSchemaRef('NotFound'),
          415: componentSchemaRef('UnsupportedMediaType'),
        },
      },
      post: {
        summary: 'Create an invitation',
        description:
          "Creates a shareable invitation link (account admins only). Gated by the plan's teammate limit (402 when full). The response's acceptUrl is the link to share.",
        parameters: [dynamicSegment('id')],
      },
    },
    '/v1/invitations/accept': {
      post: {
        summary: 'Accept an invitation',
        description:
          'Accepts an invitation token, joining its account as a member. Body: { "token": "..." }. Idempotent for existing members.',
      },
    },
    '/v1/invitations/{id}': {
      delete: {
        summary: 'Revoke an invitation',
        description: 'Revokes a pending invitation (account admins only).',
        parameters: [dynamicSegment('id')],
      },
    },
    '/v1/memberships/{id}': {
      delete: {
        summary: 'Remove a member',
        description:
          'Admins may remove anyone; members may remove themselves (leave). The account owner cannot be removed. When the removed member was active in that account, their active account falls back to their personal one.',
        parameters: [dynamicSegment('id')],
      },
    },
    '/v1/api-keys': {
      get: {
        summary: 'List API keys',
        description:
          'Lists your API keys for the account, with the account-wide quota in `meta` ({ limit, used, remaining }). Key secrets are never included. Managing keys requires the browser session — a key cannot mint or revoke keys.',
        parameters: [accountParam],
        responses: {
          401: componentSchemaRef('Unauthenticated'),
          404: componentSchemaRef('NotFound'),
          415: componentSchemaRef('UnsupportedMediaType'),
        },
      },
      post: {
        summary: 'Create an API key',
        description:
          'Creates an API key on your membership in the account. Body: { "name": "...", "scopes": ["links:read", "links:write"], "expiresInDays": 90 } (expiresInDays optional — omit for a non-expiring key). Gated by the account plan\'s API key limit: hobby 1, project 3, others 0 (402 when full). The secret (the `token` attribute, `nvp_...`) is ONLY in this response — store it immediately. Use it as `Authorization: Bearer nvp_...` on the links endpoints.',
        parameters: [accountParam],
      },
    },
    '/v1/api-keys/{id}': {
      delete: {
        summary: 'Revoke an API key',
        description: 'Revokes one of your API keys. 404 when there is nothing to revoke.',
        parameters: [dynamicSegment('id'), accountParam],
      },
    },
    '/v1/domains': {
      get: {
        summary: 'List custom domains',
        description: "Lists the account's custom domains.",
        parameters: [accountParam, includeParam('account.admin')],
        responses: {
          401: componentSchemaRef('Unauthenticated'),
          415: componentSchemaRef('UnsupportedMediaType'),
        },
      },
      post: {
        summary: 'Add a custom domain',
        description:
          'Adds a custom domain for link creation (account admins only). Body is a { json:api } resource document: { "data": { "type": "custom-domain", "attributes": { "hostname": "links.example.com" } } }. Gated by the plan\'s domain limit (402 when full). Short links can then be created with a "domain" property.',
        parameters: [accountParam],
      },
    },
    '/v1/domains/{id}': {
      delete: {
        summary: 'Remove a custom domain',
        description: 'Removes a custom domain (account admins only). Links on it stop resolving.',
        parameters: [dynamicSegment('id')],
      },
    },
    '/v1/billing/status': {
      get: {
        summary: 'Billing status',
        description:
          "The account's plan, usage (links used/remaining this period), Stripe subscription state, and the available plans.",
        parameters: [accountParam],
        responses: {
          200: {
            description: 'OK',
            content: {
              [mimeType]: {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: jsonapiRef('definitions/resource') },
                  },
                  example: {
                    data: {
                      type: 'billing-status',
                      id: 'account-uuid',
                      attributes: {
                        hasActiveSubscription: false,
                        plan: { key: 'none', name: 'No subscription', monthlyLinkLimit: 5 },
                        usage: { used: 2, remaining: 3 },
                      },
                    },
                  },
                },
              },
            },
          },
          401: componentSchemaRef('Unauthenticated'),
          404: componentSchemaRef('NotFound'),
          415: componentSchemaRef('UnsupportedMediaType'),
        },
      },
    },
    '/v1/billing/checkout': {
      post: {
        summary: 'Start a Stripe Checkout session',
        description:
          'Starts a subscription checkout for the account (account admins only). Body: { "plan": "side-hobby" | "hobby" | "project" }. Returns the Stripe-hosted checkout URL to redirect the browser to. 409 when a subscription is already active.',
        parameters: [accountParam],
      },
    },
    '/v1/billing/portal': {
      post: {
        summary: 'Open the Stripe billing portal',
        description:
          'Creates a Stripe billing-portal session for the account (account admins only) — plan changes and cancellation happen there. Returns the portal URL to redirect the browser to.',
        parameters: [accountParam],
      },
    },
    '/v1/users/{id}': {
      get: {
        summary: 'Show user',
        description:
          "Shows a user within your authenticated user's account. Other users are not visible.",
        parameters: [dynamicSegment('id')],
        responses: {
          200: {
            description: 'OK',
            content: {
              [mimeType]: {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: jsonapiRef('definitions/resource') },
                    included: { $ref: jsonapiRef('definitions/included') },
                  },
                  example: {
                    data: {
                      type: 'user',
                      id: 'uuid',
                      attributes: { name: 'A. Person' },
                    },
                    included: [],
                  },
                },
              },
            },
          },
          401: componentSchemaRef('Unauthenticated'),
          404: componentSchemaRef('NotFound'),
          415: componentSchemaRef('UnsupportedMediaType'),
        },
      },
    },
  },
};

export default V1;
