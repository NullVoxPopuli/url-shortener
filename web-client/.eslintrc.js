'use strict';

const { configs } = require(`@nullvoxpopuli/eslint-configs`);

const base = configs.ember();

module.exports = {
  ...base,
  overrides: [...base.overrides],
};
