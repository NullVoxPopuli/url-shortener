import { mimeType } from '#jsonapi';
import { componentSchemaRef, dynamicSegment, jsonapiRef } from '#openapi';
import type { OpenAPIObject } from 'openapi3-ts/oas31';

const V1: Omit<OpenAPIObject, 'info' | 'openapi'> = {
  paths: {
    '/v1/links': {
      get: {
        summary: 'List links',
        description:
          "Lists the account's links. Account-scoped endpoints (links, billing, domains) accept an optional `?account=<id>` — an account you belong to; without it, your personal account is used.",
        parameters: [],
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
        description: 'Create a new short link belonging to your authenticated user',
      },
    },
    '/v1/links/{id}': {
      get: {
        summary: 'Show link',
        parameters: [dynamicSegment('id')],
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
        parameters: [dynamicSegment('id')],
        summary: 'Delete link',
        description: 'Delete a link owned by your authenticated user',
      },
    },
    '/v1/links/{id}/visits': {
      get: {
        summary: 'List visits for a link',
        description:
          'Lists recorded visits ("clicks") for a link owned by your authenticated user, most recent first. Each visit records when it happened, the referrer, and the user agent.',
        parameters: [dynamicSegment('id')],
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
          'Creates an additional (non-personal) account with you as admin. Body: { "name": "..." }. Gated by your personal account\'s plan: side-hobby 1, hobby 2, project 3, unpaid 0 (402 when full).',
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
        description: 'Lists the members of an account you belong to, with user info included.',
        parameters: [dynamicSegment('id')],
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
        parameters: [dynamicSegment('id')],
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
    '/v1/domains': {
      get: {
        summary: 'List custom domains',
        description: "Lists the active account's custom domains.",
        responses: {
          401: componentSchemaRef('Unauthenticated'),
          415: componentSchemaRef('UnsupportedMediaType'),
        },
      },
      post: {
        summary: 'Add a custom domain',
        description:
          'Adds a custom domain for link creation (account admins only). Body: { "hostname": "links.example.com" }. Gated by the plan\'s domain limit (402 when full). Short links can then be created with a "domain" property.',
      },
    },
    '/v1/domains/{id}': {
      delete: {
        summary: 'Remove a custom domain',
        description: 'Removes a custom domain (account admins only). Links on it stop resolving.',
        parameters: [dynamicSegment('id')],
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
