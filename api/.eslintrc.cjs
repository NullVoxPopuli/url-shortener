'use strict'

module.exports = {
  extends: ['@adonisjs/eslint-config/app'],
  rules: {
    // I love shadows
    '@typescript-eslint/no-shadow': 'off',
  },
}
