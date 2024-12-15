// @ts-expect-error
import { configApp } from '@adonisjs/eslint-config';
const base = configApp();

export default [
  ...base,
  {
    files: ['**/*.ts'],
    rules: {
      // We like shadows here
      '@typescript-eslint/no-shadow': 'off',

      // Filename conventions are silly
      '@unicorn/filename-case': 'off',
    },
  },
];
