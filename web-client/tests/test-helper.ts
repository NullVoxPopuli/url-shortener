import { setApplication } from '@ember/test-helpers';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import { start as qunitStart } from 'ember-qunit';

import Application from 'web-client/app';
import config from 'web-client/config/environment';

export function start() {
  setApplication(Application.create(config.APP));

  setup(QUnit.assert);

  qunitStart();
}
