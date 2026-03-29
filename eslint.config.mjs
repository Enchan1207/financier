// @ts-check
// NOTE: プラグインの命名は eslint-plugin を削ったlowerCamelCase

import eslint from '@eslint/js'
import vitest from '@vitest/eslint-plugin'
import { defineConfig } from 'eslint/config'
import prettierConfig from 'eslint-config-prettier'
import * as importPlugin from 'eslint-plugin-import'
import reactPlugin from 'eslint-plugin-react'
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
import unusedImportsPlugin from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: ['**/dist', '**/node_modules', '**/components/ui'],
  },

  // MARK: - Language config
  eslint.configs.recommended,
  tseslint.configs.strict,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    extends: [tseslint.configs.strictTypeChecked],
  },

  {
    files: ['packages/app/frontend/**/*.{ts,tsx}'],
    languageOptions: {
      ...reactPlugin.configs.flat['jsx-runtime'].languageOptions,
      globals: globals.browser,
    },
    extends: [reactPlugin.configs.flat['jsx-runtime']],
  },

  {
    name: 'backend',
    files: ['packages/app/backend/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // MARK: - Plugins config

  {
    name: 'plugin rules',
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/max-expects': ['error', { max: 1 }],
    },
  },

  // based on: https://typescript-eslint.io/getting-started/typed-linting
  {
    name: 'react plugin settings',
    settings: {
      react: {
        createClass: 'createReactClass',
        pragma: 'React',
        fragment: 'Fragment',
        version: 'detect',
        defaultVersion: '',
        flowVersion: '0.53',
      },
      propWrapperFunctions: [
        'forbidExtraProps',
        { property: 'freeze', object: 'Object' },
        { property: 'myFavoriteWrapper' },
        { property: 'forbidExtraProps', exact: true },
      ],
      componentWrapperFunctions: [
        'observer',
        { property: 'styled' },
        { property: 'observer', object: 'Mobx' },
        { property: 'observer', object: '<pragma>' },
      ],
      formComponents: [
        'CustomForm',
        { name: 'SimpleForm', formAttribute: 'endpoint' },
        { name: 'Form', formAttribute: ['registerEndpoint', 'loginEndpoint'] },
      ],
      linkComponents: [
        'Hyperlink',
        { name: 'MyLink', linkAttribute: 'to' },
        { name: 'Link', linkAttribute: ['to', 'href'] },
      ],
    },
  },

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

  // MARK: - Additional rules

  {
    name: 'frontend rules',
    files: ['packages/app/frontend/**/*.{ts,tsx}'],
    plugins: { react: reactPlugin },
    rules: {
      'no-console': 'warn',
      'react/hook-use-state': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            // NOTE: イベントハンドラ内で非同期処理をしたいことがある
            attributes: false,
          },
        },
      ],
    },
  },

  {
    name: 'frontend components',
    files: ['packages/app/frontend/routes/**/index.tsx'],
    rules: {
      // NOTE: redirect
      '@typescript-eslint/only-throw-error': [
        'off',
        /*
        本来は以下の記述でRedirectオブジェクトだけを許可できるが、
        TanStack Routerがappパッケージ内にインストールされているためか、指定子がうまく動作しない。

        {
          allow: [
            {
              from: 'package',
              name: 'Redirect',
              package: '@tanstack/react-router',
            },
          ],
        },
        */
      ],
    },
  },

  {
    name: 'backend rules',
    files: ['packages/app/backend/**/*.ts'],
    rules: {
      // there is no rules yet
    },
  },

  {
    name: 'common rules',
    files: ['**/*.{ts,tsx}'],
    rules: {
      eqeqeq: ['error', 'always'],
      'no-useless-rename': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      // NOTE: @typescript-eslint/no-restricted-imports はここに書かない。
      // 'Avoid direct import of external package' ブロックで一元管理する。
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
    },
  },

  {
    files: ['**/*.d.ts'],
    rules: {
      // NOTE: 同一構造のinterfaceを別名で定義したいことがある
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // MARK: - Architecture rules

  {
    name: 'LOC limitation for frontend',
    files: ['**/*.tsx'],
    rules: {
      'max-lines': [
        'warn',
        {
          max: 350,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },

  {
    name: 'LOC limitation for page component',
    files: ['**/index.tsx'],
    rules: {
      'max-lines': [
        'warn',
        {
          max: 200,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },

  {
    name: 'Avoid direct import of external package',
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dayjs',
              message: 'Use @frontend/lib/date or @backend/lib/date instead',
            },
            {
              name: '@routes',
              message: 'frontend must not depends on backend types',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Use src/lib/client',
        },
        {
          name: 'Date',
          message: 'Use @frontend/lib/date or @backend/lib/date instead',
        },
      ],
    },
  },

  // NOTE: フロントエンド固有の import 制約。
  // 'Avoid direct import of external package' より後に置くことで
  // @typescript-eslint/no-restricted-imports を正しく上書きする。
  {
    name: 'frontend import restrictions',
    files: ['packages/app/frontend/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dayjs',
              message: 'Use @frontend/lib/date or @backend/lib/date instead',
            },
            {
              name: '@routes',
              message: 'frontend must not depends on backend types',
            },
          ],
        },
      ],
    },
  },

  // MARK: - Backend architecture rules

  {
    name: 'backend page API rules',
    files: ['packages/app/backend/pages/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            // NOTE: dayjsの制約が上書きされてしまうため、重ねがけ
            {
              name: 'dayjs',
              message: 'Use @backend/lib/date instead',
            },
          ],
          patterns: [
            {
              group: ['**/workflow', '**/workflow.ts'],
              message: 'route of pages must not import any workflows',
            },
          ],
        },
      ],
    },
  },

  {
    name: 'backend workflow rules',
    files: ['packages/app/backend/features/**/workflow.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            // NOTE: dayjsの制約が上書きされてしまうため、重ねがけ
            {
              name: 'dayjs',
              message: 'Use @backend/lib/date instead',
            },
          ],
          patterns: [
            {
              group: ['**/schemas/**'],
              message: 'workflows must not import any db schema',
            },
          ],
        },
      ],
    },
  },

  prettierConfig,
)
