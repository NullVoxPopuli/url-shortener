/**
 * If you find yourself looking at this file thinking
 * you need to add a port to the rootHost, you must re-re-remember
 * that this is not needed!
 *
 * Remeber to use the domain "nvp.local" in your browser
 * after running the apache2 config installer at
 * <rootOfRepo>/config/install.sh
 */
import env, { DOMAIN } from '#start/env';
import edge from 'edge.js';

const isHosted = DOMAIN === 'nvp.gg';
const isLocal = DOMAIN.includes('localhost') || DOMAIN.includes('nvp.local');
const isDev = env.get('NODE_ENV') === 'development';

edge.global('isLocal', isLocal);
edge.global('isDev', isDev);
edge.global('isHosted', isHosted);
edge.global('DOMAIN', DOMAIN);
