import { BaseCommand } from '@adonisjs/core/ace';
import { CommandOptions } from '@adonisjs/core/types/ace';

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

const HERE = import.meta.dirname;
const PUBLIC = join(HERE, '../public');
const OUTPUT_PATH = join(PUBLIC, 'swagger.json');

const SWAGGER_SCHEMAS = {
  Any: { description: 'Any JSON object not defined as schema' },
};

function generate() {
  const main: OpenAPIObject = {
    openapi: '3.0.0',
    info: {
      title: 'nvp.gg API Documentation',
      version: '1.0.0',
      description: 'Documentation for the { json:api } API for using nvp.gg',
    },
    components: {
      schemas: {
        ...SWAGGER_SCHEMAS,
      },
    },
    servers: [
      {
        url: 'https://api.nvp.gg',
        // description: '',
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
