import { mimeType } from '#jsonapi';
import { componentSchemaRef, dynamicSegment, jsonapiRef, ref } from '#openapi';
import { OpenAPIObject } from 'openapi3-ts/oas31';

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
  },
};

export default V1;
