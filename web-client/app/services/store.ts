export { default } from '@ember-data/store';
import { setBuildURLConfig } from '@ember-data/request-utils';

setBuildURLConfig({
  host: 'https://nvp.gg',
  namespace: '_/v1',
});
