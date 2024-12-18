import { dynamicSegment } from '#openapi';
import { OpenAPIObject } from 'openapi3-ts/oas31';

const V1: Omit<OpenAPIObject, 'info' | 'openapi'> = {
  paths: {
    '/v1/links': {
      get: {
        summary: 'List links',
        description: 'Lists links belonging to your authenticated user',
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
              'application/vnd.api+json': {},
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
