'use strict';

module.exports = {
  extends: ['@adonisjs/eslint-config/app'],
  rules: {
    // I love shadows
    '@typescript-eslint/no-shadow': 'off',
    // filename conventions have no place if if we're going
    // to wire everything up with explicit imports
    'unicorn/filename-case': 'off',
  },
};
