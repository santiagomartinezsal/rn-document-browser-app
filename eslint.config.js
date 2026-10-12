const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const boundaries = require('eslint-plugin-boundaries');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  { ignores: ['dist/*'] },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/no-cycle': 'error',
    },
  },
  {
    // Each feature exposes its public surface through index.ts (see CLAUDE.md's
    // Architecture section); this blocks any file outside a feature's own folder
    // from importing its internals directly.
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'feature', pattern: 'src/features/*' },
        { type: 'app', pattern: 'src/app' },
        { type: 'shared', pattern: 'src/shared' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              to: { element: { type: 'feature' } },
              disallow: { to: { element: { fileInternalPath: ['**/*'] } } },
            },
            {
              to: { element: { type: 'feature' } },
              allow: { to: { element: { fileInternalPath: ['index.ts'] } } },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: __dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },
]);
