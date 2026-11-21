import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // The report is untyped JSON from Playwright; `any` is used on purpose at that boundary.
      '@typescript-eslint/no-explicit-any': 'off',
      // tools.ts reads its version with require so it works from both src/ and dist/.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['tests/**/*.ts', 'examples/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
);
