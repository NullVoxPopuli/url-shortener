import { mimeType } from '#jsonapi';
import { componentSchemaRef, dynamicSegment, jsonapiRef } from '#openapi';
import type { OpenAPIObject } from 'openapi3-ts/oas31';

const V1: Omit<OpenAPIObject, 'info' | 'openapi'> = {
  paths: {
    '/v1/links': {
      get: {
        summary: 'List links',
        description: 'Lists links belonging to your authenticated user',
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
