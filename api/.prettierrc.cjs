'use strict';

module.exports = {
  printWidth: 100,
  plugins: ['prettier-edgejs'],
  overrides: [
    {
      // Lol, JavaScript
      files: ['*.js', '*.ts', '*.cjs', '.mjs', '.cts', '.mts', '.cts', '.gjs', '.gts'],
      options: {
        singleQuote: true,
        trailingComma: 'es5',
      },
    },
    {
      files: ['*.json'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.hbs'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.gjs', '*.gts'],
      options: {
        parser: 'ember-template-tag',
        singleQuote: true,
        templateSingleQuote: false,
        trailingComma: 'es5',
      },
    },
    {
      files: ['*.edge'],
      options: {
        singleQuote: true,
        useTabs: false,
        quoteProps: 'consistent',
        bracketSpacing: true,
        arrowParens: 'always',
        plugins: ['prettier-edgejs'],
      },
    },
  ],
};
