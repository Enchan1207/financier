// @ts-check
// NOTE: プラグインの命名は eslint-plugin を削ったlowerCamelCase
import eslint from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import * as importPlugin from 'eslint-plugin-import'
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
import unusedImportsPlugin from 'eslint-plugin-unused-imports'
import vuePlugin from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

export default tseslint.config(
  // MARK: - Base configurations

  {
    name: 'global ignore',
    ignores: ['**/dist', '**/node_modules', '**/.wrangler/', '**/_legacy'],
  },

  // MARK: - Shared configurations
  eslint.configs.recommended,

  // configurations for TypeScript with type checking
  // based on: https://typescript-eslint.io/getting-started/typed-linting
  {
    name: 'backend',
    files: ['backend/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: { project: true },
    },
    extends: [tseslint.configs.strictTypeChecked],
  },

  // configurations for Vue
  // based on:
  //  - https://eslint.vuejs.org/user-guide/#example-configuration-with-typescript-eslint-and-prettier
  //  - https://typescript-eslint.io/troubleshooting/faqs/frameworks#i-am-running-into-errors-when-parsing-typescript-in-my-vue-files
  {
    name: 'frontend',
    files: ['frontend/**/*.ts', 'frontend/**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parser: vueParser,
      parserOptions: {
        project: true,
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    extends: [tseslint.configs.strict, vuePlugin.configs['flat/recommended']],
  },

  // configurations for TypeScript with type checking
  // based on: https://typescript-eslint.io/getting-started/typed-linting
  {
    name: 'workflow scripts',
    files: ['.github/scripts/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: { project: true },
    },
    extends: [tseslint.configs.strictTypeChecked],
  },

  // configurations for config files
  {
    name: 'frontend config files',
    files: ['**/*.config.{j,mj,t.mt}s'],
    languageOptions: { globals: globals.node },
  },

  // MARK: - Plugin settings

  {
    name: 'import rules',
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'unused-import': unusedImportsPlugin,
    },
    rules: {
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/consistent-type-specifier-style': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-import/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-import/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    name: 'frontend rules',
    files: ['frontend/**/*.ts', 'frontend/**/*.vue'],
    plugins: { vue: vuePlugin },
    rules: {
      'no-console': 'warn',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dayjs',
              message: 'Use @/logic/dayjs instead.',
            },
          ],
          patterns: [
            {
              group: ['@routes/**'],
              message: 'Do not use backend types.',
              allowTypeImports: false,
            },
          ],
        },
      ],
      'vue/no-undef-components': [
        'error',
        {
          ignorePatterns: ['^Router[A-Z]', '^router-[a-z]', '^el-[a-z]+'],
        },
      ],
    },
  },

  {
    name: 'custom rules for pages',
    files: ['frontend/src/pages/**/*.vue'],
    plugins: { vue: vuePlugin },
    rules: {
      // NOTE: ファイルベースルーティングでは index.vue や [id].vue を作りたくなるため
      'vue/multi-word-component-names': 'off',
    },
  },

  {
    name: 'backend rules',
    files: ['backend/**/*.ts', 'backend/**/*.vue'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dayjs',
              message: 'Use @/logic/dayjs instead.',
            },
          ],
        },
      ],
    },
  },

  {
    name: 'backend architecture rules - domains',
    files: ['backend/src/domains/**/*.ts', 'backend/src/domains/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features'],
              message:
                'Do not import features at domains. ドメインレイヤは機能に依存してはいけません。',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },

  {
    name: 'backend architecture rules - workflow',
    files: [
      'backend/**/workflow.ts',
      'backend/**/workflow.test.ts',
      'backend/**/workflow/**/*.ts',
      'backend/**/workflow/**/*.test.ts',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/dao'],
              message:
                'Do not import dao at workflow. ワークフローにdaoは必要ないはずです。',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },

  {
    name: 'common rules',
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      eqeqeq: ['error', 'always'],
      'no-useless-rename': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
    },
  },

  prettierConfig,
)
