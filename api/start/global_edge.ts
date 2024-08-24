import env from '#start/env';
import edge from 'edge.js';

const HOST = env.get('HOST');
const PORT = env.get('PORT');

const isHosted = HOST === 'nvp.gg';
const isLocal = HOST.includes('localhost') || HOST.includes('nvp.local');
const isDev = env.get('NODE_ENV') === 'development';

const rootHost = isHosted ? HOST : `${HOST}:${PORT}`;

edge.global('isLocal', isLocal);
edge.global('isDev', isDev);
edge.global('isHosted', isHosted);
edge.global('rootHost', rootHost);
