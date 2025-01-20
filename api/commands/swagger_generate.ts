import { BaseCommand } from '@adonisjs/core/ace';
import { CommandOptions } from '@adonisjs/core/types/ace';
import { stripIndent } from 'common-tags';

export default class SwaggerGenerate extends BaseCommand {
  static commandName = 'swagger:generate';

  static options: CommandOptions = {
    startApp: false,
    allowUnknownFlags: false,
    staysAlive: false,
  };

  async run() {
    await writeToPublic();
  }
}

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { merge } from 'ts-deepmerge';
import v1 from '#controllers/api/v1/swag';
import type { OpenAPIObject } from 'openapi3-ts/oas31';
import { specName, mimeType } from '#jsonapi';
import { componentSchemaRef, jsonapiRef, ref } from '#openapi';
import { DOMAIN } from '#start/env';

const HERE = import.meta.dirname;
const PUBLIC = join(HERE, '../public');
const OUTPUT_PATH = join(PUBLIC, 'swagger.json');

const SWAGGER_SCHEMAS = {
  Any: { description: 'Any JSON object not defined as schema' },
  Relationship: {
    description: `A ${specName} Relationship`,
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            type: 'string',
            id: 'string',
          },
        },
      },
    },
  },
  Link: {
    description: 'A Link',
    schema: {
      type: 'object',
      properties: {
        id: 'string',
        attributes: {
          schema: {
            type: 'object',
            properties: {
              shortUrl: 'string',
              visits: 'integer',
              createdAt: 'date',
              updatedAt: 'date',
              expiresAt: 'date',
            },
          },
        },
        relationships: {
          type: 'object',
          properties: {
            ownedBy: componentSchemaRef('Relationship'),
            createdBy: componentSchemaRef('Relationship'),
          },
        },
      },
    },
  },
  Unauthenticated: {
    description: 'Unauthenticated',
    content: {
      [mimeType]: {
        schema: {
          $ref: '#/components/schemas/Error',
        },
      },
    },
  },
  UnsupportedMediaType: {
    description: 'Unsupported Media Type',
    content: {
      'application/json': ref(jsonapiRef('errors')),
      'text/html': ref(jsonapiRef('errors')),
      '*': ref(jsonapiRef('errors')),
    },
  },
  Error: {
    description: 'A{ json:api } error. See: https://jsonapi.org/examples/#error-objects',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'integer' },
        title: { type: 'string' },
        detail: { type: 'string' },
        source: { type: 'string' },
        code: { type: 'string' },
      },
    },
  },
};

/**
 * Docs:
 * - https://swagger.io/docs/specification/v3_0/
 */
function generate() {
  const main: OpenAPIObject = {
    openapi: '3.0.0',
    info: {
      title: 'nvp.gg API Documentation',
      version: '1.0.0',
      /**
       * If you copy my project, you are required
       * to open source it.
       *
       * I will take legal action if you try to make money
       * on a closed-source copy of this project.
       */
      license: {
        name: 'GNU AGPLv3',
        url: 'https://choosealicense.com/licenses/agpl-3.0/',
        // @ts-ignore
        sponsor: {
          description: `If you'd like to support me, you can at either GitHub Sponsors, or Ko-Fi`,
          github_sponsors: `https://github.com/sponsors/NullVoxPopuli?frequency=one-time&amount=5`,
          ko_fi: `https://ko-fi.com/nullvoxpopuli`,
        },
        // @ts-ignore
        note: stripIndent`
          If you copy my project, you are required to open source it.

          Open Source software helps everyone out by providing free learning materials and examples to be used in projects that are closed source.

          This project aims to be an example of how to do certain things for others (and mostly myself), and knowledge alone should not be kept secret.

          I am allowed to take legal action if you try to make money
          on a closed-source copy of this project.
        `.replaceAll('\n', ' '),
      },
      contact: {
        name: 'API Support',
        email: 'support@nvp.gg',
        url: `https://${DOMAIN}/_/support`,
      },
      termsOfService: `https://${DOMAIN}/_/terms`,
      description: stripIndent`
        Documentation for the [\`{ json:api }\`](https://jsonapi.org) API for using [nvp.gg](https://nvp.gg)

        ------------------------

        Unauthenticated users are limited to 1 request per minute.

        Authenticated users are limited to 100 requests per minute.

        All endpoints use the \`${mimeType}\` MIME type for both \`Accept\` and \`Content-Type\` headers.
      `,
    },
    components: {
      schemas: {
        jsonapi: {
          $ref: 'https://raw.githubusercontent.com/json-api/json-api/refs/heads/gh-pages/_schemas/1.0/schema.json',
        },
        ...SWAGGER_SCHEMAS,
      },
    },
    servers: [
      {
        url: 'https://api.nvp.gg',
        description: 'The API endpoint for nvp.gg',
      },
    ],
    tags: [],
  };

  return merge(main, v1);
}

export async function writeToPublic() {
  const json = await generate();

  await writeFile(OUTPUT_PATH, JSON.stringify(json));
}
