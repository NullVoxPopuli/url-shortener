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

      // Formatting is enforced separately (`pnpm format` + git diff in CI's
      // Lint job). Running prettier per-file inside eslint is double work,
      // and it deadlocks: eslint-plugin-prettier's synckit worker does
      // `import prettier from 'prettier'`, which crashes on our
      // source-built prettier fork (no default export) and leaves the
      // main thread blocked on Atomics.wait forever.
      'prettier/prettier': 'off',
    },
  },
];
