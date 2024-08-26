/**
 * If you find yourself looking at this file thinking
 * you need to add a port to the rootHost, you must re-re-remember
 * that this is not needed!
 *
 * Remeber to use the domain "nvp.local" in your browser
 * after running the apache2 config installer at
 * <rootOfRepo>/config/install.sh
 */
import env from '#start/env';
import edge from 'edge.js';

const HOST = env.get('HOST');

const isHosted = HOST === 'nvp.gg';
const isLocal = HOST.includes('localhost') || HOST.includes('nvp.local');
const isDev = env.get('NODE_ENV') === 'development';

edge.global('isLocal', isLocal);
edge.global('isDev', isDev);
edge.global('isHosted', isHosted);
edge.global('rootHost', HOST);
