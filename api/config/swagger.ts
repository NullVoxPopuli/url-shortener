// for AdonisJS v6
import path from 'node:path';
import url from 'node:url';

export default {
  // To the root of the project
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',
  tagIndex: 2,
  info: {
    title: 'nvp.gg API Documentation',
    version: '1.0.0',
    description: 'Documentation for the { json:api } API for using nvp.gg',
  },
  snakeCase: true,

  debug: false, // set to true, to get some useful debug output
  ignore: ['/_/', '/'],
  // if PUT/PATCH are provided for the same route, prefer PUT
  // But we want to be explicit
  preferredPutPatch: 'PATCH',
  common: {
    parameters: {}, // OpenAPI conform parameters that are commonly used
    headers: {}, // OpenAPI conform headers that are commonly used
  },
  securitySchemes: {}, // optional
  authMiddlewares: ['auth', 'auth:api'], // optional
  defaultSecurityScheme: 'BearerAuth', // optional
  // persist authorization between reloads on the swagger page
  persistAuthorization: true,
  // the path displayed after endpoint summary
  showFullPath: true,
};
