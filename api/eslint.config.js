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

      // Types stay OUTSIDE the braces (`import type { X }`): an import
      // whose specifiers are all inline types (`import { type X }`) leaves
      // a live `import {} from '...'` side effect behind when types are
      // stripped. The adonis config prefers inline; override the fix style
      // and forbid the all-inline-type form outright.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',

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
