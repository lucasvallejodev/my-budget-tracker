import stylistic from '@stylistic/eslint-plugin';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import preferArrow from 'eslint-plugin-prefer-arrow-functions';
import prettier from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';
import multilineTypeAlias from './scripts/eslint-rules/multiline-type-alias.mjs';

/** Rules that exist only in this repository (see scripts/eslint-rules/). */
const LocalRules = { rules: { 'multiline-type-alias': multilineTypeAlias } };

/**
 * Names Next.js requires on module-level exports; they are exempt from the constant
 * naming rule below.
 */
const nextReservedExports =
  'metadata|viewport|config|dynamic|dynamicParams|revalidate|fetchCache|runtime|preferredRegion|maxDuration';

/** Pattern for a PascalCase identifier (`Colors`, `FinanceKeys`). */
const pascalCase = '^[A-Z][A-Za-z0-9]*$';

/** Selector fragments for a module-level `const` (plain or exported). */
const moduleConst =
  ':matches(Program, Program > ExportNamedDeclaration) > VariableDeclaration[kind="const"]';

const literalTable = ':matches(ObjectExpression, ArrayExpression)';
const notPascal = `VariableDeclarator[id.type="Identifier"][id.name!=/${pascalCase}/][id.name!=/^(${nextReservedExports})$/]`;

const constantNamingMessage =
  'Module-level constant objects and arrays are PascalCase (`Colors`, `FinanceKeys`). Check src/lib, src/constants and src/styles/theme.ts before adding a new one.';

const colourMessage =
  'Hard-coded colour. Add it to `Colors` in src/styles/theme.ts (or a token in src/styles/tokens.scss) and reference it from there.';

const config = [
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      '.next/**',
      'public/**',
      'coverage/**',
      'playwright-report/**',
      'temp/**',
      'docs/**',
      'src/generated/**',
      'next-env.d.ts',
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['vitest.config.mts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  sonarjs.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier,
      '@stylistic': stylistic,
      'prefer-arrow-functions': preferArrow,
      local: LocalRules,
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          ignorePrimitives: {
            string: true,
            number: true,
            boolean: true,
          },
        },
      ],
      // react-hook-form's handleSubmit returns a promise; passing it to onSubmit is the documented use.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],

      // Readability: blank lines. Prettier never adds blank lines, this rule does (fixable).
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: 'directive',
          next: '*',
        },
        {
          blankLine: 'any',
          prev: 'directive',
          next: 'directive',
        },
        {
          blankLine: 'always',
          prev: 'import',
          next: '*',
        },
        {
          blankLine: 'any',
          prev: 'import',
          next: 'import',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'export',
        },
        {
          blankLine: 'any',
          prev: 'export',
          next: 'export',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: ['function', 'class', 'multiline-block-like'],
        },
        {
          blankLine: 'always',
          prev: ['function', 'class', 'multiline-block-like'],
          next: '*',
        },
        {
          blankLine: 'always',
          prev: ['const', 'let'],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: ['const', 'let'],
          next: ['const', 'let'],
        },
        {
          blankLine: 'always',
          prev: '*',
          next: ['interface', 'type'],
        },
        {
          blankLine: 'any',
          prev: ['interface', 'type'],
          next: ['interface', 'type'],
        },
        // A declaration that spans several lines stands alone: blank line before and after.
        {
          blankLine: 'always',
          prev: ['multiline-const', 'multiline-let', 'multiline-var'],
          next: '*',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: ['multiline-const', 'multiline-let', 'multiline-var'],
        },
      ],
      '@stylistic/lines-between-class-members': [
        'error',
        'always',
        { exceptAfterSingleLine: true },
      ],
      // Object literals with three or more properties and type aliases with three or more
      // members go one entry per line. Prettier keeps them expanded (objectWrap: preserve),
      // so the two tools agree. Type literals in parameter positions are left to Prettier,
      // which collapses them.
      '@stylistic/object-curly-newline': [
        'error',
        {
          ObjectExpression: { consistent: true, minProperties: 3 },
          TSTypeLiteral: { consistent: true },
        },
      ],
      '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      'local/multiline-type-alias': ['error', { minMembers: 3 }],
      curly: ['error', 'multi-line'],

      // Constants and colours live in one place.
      'no-restricted-syntax': [
        'error',
        {
          selector: `${moduleConst} > ${notPascal} > ${literalTable}`,
          message: constantNamingMessage,
        },
        {
          selector: `${moduleConst} > ${notPascal} > :matches(TSAsExpression, TSSatisfiesExpression) > ${literalTable}`,
          message: constantNamingMessage,
        },
        { selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]', message: colourMessage },
        { selector: 'Literal[value=/^(rgb|hsl)a?\\(/]', message: colourMessage },
        { selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{6}/]', message: colourMessage },
      ],

      // Complexity budget. Warnings first; tighten to errors once the backlog is gone.
      complexity: ['warn', { max: 10 }],
      'sonarjs/cognitive-complexity': ['warn', 15],
      'max-depth': ['warn', 3],
      'max-params': ['warn', 4],
      'max-lines-per-function': [
        'warn',
        {
          max: 80,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      'max-lines': [
        'warn',
        {
          max: 400,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'sonarjs/no-nested-conditional': 'warn',

      // Sonar rules that duplicate typescript-eslint or fight React conventions.
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/prefer-regexp-exec': 'off',
      'sonarjs/no-selector-parameter': 'off',
    },
  },
  {
    // Utilities and server code: arrow functions with explicit return types.
    files: ['src/lib/**/*.ts', 'src/server/**/*.ts', 'src/constants/**/*.ts'],
    rules: {
      'prefer-arrow-functions/prefer-arrow-functions': [
        'error',
        {
          allowNamedFunctions: false,
          allowObjectProperties: true,
          returnStyle: 'unchanged',
        },
      ],
    },
  },
  {
    files: ['src/lib/**/*.ts', 'src/constants/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowIIFEs: true,
        },
      ],
    },
  },
  // Plain JS files (scripts, configs) are not part of the TypeScript project.
  { files: ['**/*.{js,mjs,cjs}'], ...tseslint.configs.disableTypeChecked },
  {
    // React props are often declared as method signatures (Radix); they are never `this`-bound.
    files: ['**/*.tsx'],
    rules: { '@typescript-eslint/unbound-method': 'off' },
  },
  {
    files: ['src/styles/theme.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**', 'scripts/**', '*.config.{ts,mts,js,mjs}'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'prefer-arrow-functions/prefer-arrow-functions': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  {
    // Test fixtures are local data, not shared constants; stubs are allowed to be empty.
    files: ['**/*.test.{ts,tsx}', 'e2e/**'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/require-await': 'off',
      'sonarjs/no-floating-point-equality': 'off',
    },
  },
];

export default config;
