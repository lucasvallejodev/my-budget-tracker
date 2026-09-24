import stylistic from '@stylistic/eslint-plugin';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import perfectionist from 'eslint-plugin-perfectionist';
import preferArrow from 'eslint-plugin-prefer-arrow-functions';
import prettier from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import tsdoc from 'eslint-plugin-tsdoc';
import tseslint from 'typescript-eslint';

import colocatedStyles from './scripts/eslint-rules/colocated-styles.mjs';
import multilineTypeAlias from './scripts/eslint-rules/multiline-type-alias.mjs';
import noComments from './scripts/eslint-rules/no-comments.mjs';

/** Rules that exist only in this repository (see scripts/eslint-rules/). */
const LocalRules = {
  rules: {
    'colocated-styles': colocatedStyles,
    'multiline-type-alias': multilineTypeAlias,
    'no-comments': noComments,
  },
};

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
  'Module-level constant objects and arrays are PascalCase (`Colors`, `FinanceKeys`). Check the lib and constants folders of apps/web and packages/shared before adding a new one.';

const regexMessage =
  'Regular expressions live in `Patterns` (packages/shared/src/lib/patterns.ts) under a name that says what they match.';

/** eslint-plugin-jsdoc's preset for TSDoc: types come from TypeScript, never from comments. */
const tsdocPreset = jsdoc.configs['flat/recommended-tsdoc-error'];

/** Component modules under src/components (see agents/conventions.md › Components). */
const ComponentModules = ['finance', 'shell', 'ui'];

/** Which modules each component module may import: shell → finance → ui, and ui imports none. */
const ModuleDependencies = {
  finance: ['ui'],
  shell: ['finance', 'ui'],
  ui: [],
};

const forbiddenModules = moduleName =>
  ComponentModules.filter(
    other => other !== moduleName && !ModuleDependencies[moduleName].includes(other)
  );

const allowedModules = moduleName =>
  ModuleDependencies[moduleName].map(other => `@/components/${other}`).join(' and ');

const dependencyMessage = moduleName =>
  ModuleDependencies[moduleName].length
    ? `${moduleName}/ may only import ${allowedModules(moduleName)} (dependency direction: shell → finance → ui). Move shared code down instead.`
    : `${moduleName}/ must not import other component modules (dependency direction: shell → finance → ui). Pass data and callbacks in through props.`;

const deepImportMessage =
  'Import a component through its folder (`@/components/finance/account-detail`) or its module barrel (`@/components/finance`), never a file inside the folder.';

const deepComponentImport = {
  group: ['@/components/*/*/*'],
  message: deepImportMessage,
};

/** Client code reaches the server only over HTTP; shapes and rules are shared through `@/schema` and `@/lib`. */
const clientServerImport = {
  group: ['@/server', '@/server/*', '@/db', '@/db/*'],
  message:
    'Client code must not import server or database modules. Share types, Zod schemas and pure helpers through `@coinkeeper/shared`.',
};

/**
 * Import restrictions for files inside one component module: siblings by folder (`../panel`),
 * other modules through `@/components/<module>`, never the module's own barrel.
 */
const componentModuleImports = moduleName => ({
  files: [`apps/web/src/components/${moduleName}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            message: `Inside ${moduleName}/ import siblings by folder (\`../panel\`); the barrel is for other modules and would create import cycles.`,
            name: `@/components/${moduleName}`,
          },
          ...forbiddenModules(moduleName).map(other => ({
            message: dependencyMessage(moduleName),
            name: `@/components/${other}`,
          })),
        ],
        patterns: [
          deepComponentImport,
          clientServerImport,
          ...forbiddenModules(moduleName).map(other => ({
            group: [`@/components/${other}/*`],
            message: dependencyMessage(moduleName),
          })),
          {
            message: deepImportMessage,
            regex: String.raw`^\.\./[^./][^/]*/.+`,
          },
          {
            message: 'Import another component module through `@/components/<module>`.',
            regex: String.raw`^\.\./\.\./`,
          },
        ],
      },
    ],
  },
});

const colourMessage =
  'Hard-coded colour. Add it to `Colors` in apps/web/src/styles/theme.ts (or a token in apps/web/src/styles/tokens.scss) and reference it from there.';

const config = [
  {
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/.next/**',
      'apps/*/public/**',
      'coverage/**',
      'playwright-report/**',
      'temp/**',
      'docs/**',
      '**/next-env.d.ts',
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  { settings: { next: { rootDir: 'apps/web/' } } },
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  sonarjs.configs.recommended,
  prettierConfig,
  {
    plugins: {
      '@stylistic': stylistic,
      local: LocalRules,
      perfectionist,
      'prefer-arrow-functions': preferArrow,
      prettier,
    },
    rules: {
      // Readability: blank lines. Prettier never adds blank lines, this rule does (fixable).
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
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          next: '*',
          prev: 'directive',
        },
        {
          blankLine: 'any',
          next: 'directive',
          prev: 'directive',
        },
        {
          blankLine: 'always',
          next: '*',
          prev: 'import',
        },
        {
          blankLine: 'any',
          next: 'import',
          prev: 'import',
        },
        {
          blankLine: 'always',
          next: 'export',
          prev: '*',
        },
        {
          blankLine: 'any',
          next: 'export',
          prev: 'export',
        },
        {
          blankLine: 'always',
          next: 'return',
          prev: '*',
        },
        {
          blankLine: 'always',
          next: ['function', 'class', 'multiline-block-like'],
          prev: '*',
        },
        {
          blankLine: 'always',
          next: '*',
          prev: ['function', 'class', 'multiline-block-like'],
        },
        {
          blankLine: 'always',
          next: '*',
          prev: ['const', 'let'],
        },
        {
          blankLine: 'any',
          next: ['const', 'let'],
          prev: ['const', 'let'],
        },
        {
          blankLine: 'always',
          next: ['interface', 'type'],
          prev: '*',
        },
        {
          blankLine: 'any',
          next: ['interface', 'type'],
          prev: ['interface', 'type'],
        },
        // A declaration that spans several lines stands alone: blank line before and after.
        {
          blankLine: 'always',
          next: '*',
          prev: ['multiline-const', 'multiline-let', 'multiline-var'],
        },
        {
          blankLine: 'always',
          next: ['multiline-const', 'multiline-let', 'multiline-var'],
          prev: '*',
        },
      ],
      // TypeScript
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'off',

      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          detectObjects: false,
          enforceConst: true,
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
      // react-hook-form's handleSubmit returns a promise; passing it to onSubmit is the documented use.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          ignorePrimitives: {
            boolean: true,
            number: true,
            string: true,
          },
        },
      ],
      // Complexity budget. Warnings first; tighten to errors once the backlog is gone.
      complexity: ['warn', { max: 10 }],
      curly: ['error', 'multi-line'],
      // Names say what a value is for: no one-letter identifiers (see agents/conventions.md > Naming).
      'id-length': ['error', { min: 2, properties: 'never' }],
      'local/multiline-type-alias': ['error', { minMembers: 3 }],

      'local/no-comments': 'error',

      'max-depth': ['warn', 3],
      'max-lines': [
        'warn',
        {
          max: 400,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'max-lines-per-function': [
        'warn',
        {
          IIFEs: true,
          max: 80,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'max-params': ['warn', 4],
      // Constants and colours live in one place.
      'no-restricted-imports': ['error', { patterns: [deepComponentImport] }],
      'no-restricted-syntax': [
        'error',
        {
          message: constantNamingMessage,
          selector: `${moduleConst} > ${notPascal} > ${literalTable}`,
        },
        {
          message: constantNamingMessage,
          selector: `${moduleConst} > ${notPascal} > :matches(TSAsExpression, TSSatisfiesExpression) > ${literalTable}`,
        },
        { message: regexMessage, selector: 'Literal[regex]' },
        { message: regexMessage, selector: 'NewExpression[callee.name="RegExp"]' },
        { message: colourMessage, selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]' },
        { message: colourMessage, selector: 'Literal[value=/^(rgb|hsl)a?\\(/]' },
        { message: colourMessage, selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{6}/]' },
      ],

      // Deterministic order (fixable): external imports, then `@/` modules, then relative files,
      // separated by blank lines; names, object properties, destructured parameters and type
      // members alphabetically. A `// keep order` comment starts a group that is left as written.
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            'side-effect',
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'unknown',
          ],
          internalPattern: ['^@/.+', '^@coinkeeper/.+'],
          newlinesBetween: 1,
          type: 'natural',
        },
      ],

      'perfectionist/sort-named-exports': ['error', { type: 'natural' }],
      'perfectionist/sort-named-imports': ['error', { type: 'natural' }],
      'perfectionist/sort-object-types': [
        'error',
        { partitionByComment: ['^\\s*keep order'], type: 'natural' },
      ],
      'perfectionist/sort-objects': [
        'error',
        { partitionByComment: ['^\\s*keep order'], type: 'natural' },
      ],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'sonarjs/cognitive-complexity': ['warn', 15],
      // Sonar rules that duplicate typescript-eslint or fight React conventions.
      'sonarjs/deprecation': 'off',

      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/no-selector-parameter': 'off',
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/prefer-regexp-exec': 'off',
    },
  },
  {
    // Utilities and server code: arrow functions with explicit return types.
    files: [
      'apps/*/src/lib/**/*.ts',
      'apps/*/src/server/**/*.ts',
      'apps/*/src/constants/**/*.ts',
      'packages/shared/src/lib/**/*.ts',
      'packages/shared/src/constants/**/*.ts',
    ],
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
    files: [
      'apps/*/src/lib/**/*.ts',
      'apps/*/src/constants/**/*.ts',
      'packages/shared/src/lib/**/*.ts',
      'packages/shared/src/constants/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowHigherOrderFunctions: true,
          allowIIFEs: true,
          allowTypedFunctionExpressions: true,
        },
      ],
    },
  },
  {
    // Utilities document their contract in TSDoc (see agents/conventions.md > Documentation
    // comments): every exported function has a description, @param, @returns and @throws.
    files: ['apps/*/src/lib/**/*.ts', 'packages/shared/src/lib/**/*.ts'],
    ignores: ['**/*.test.ts'],
    plugins: { ...tsdocPreset.plugins, tsdoc },
    rules: {
      ...tsdocPreset.rules,
      // TSDoc has no syntax for nested parameter names (`options.locale`); describe fields on `options`.
      'jsdoc/check-param-names': ['error', { checkDestructured: false }],
      'jsdoc/require-description': 'error',
      'jsdoc/require-hyphen-before-param-description': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: { ArrowFunctionExpression: true, FunctionDeclaration: true },
        },
      ],
      'jsdoc/require-param': ['error', { checkDestructured: false }],
      'jsdoc/require-throws': 'error',
      'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
      'local/no-comments': ['error', { allowExportDocComments: true }],
      'tsdoc/syntax': 'error',
    },
  },
  ...ComponentModules.map(componentModuleImports),
  {
    files: ['apps/web/src/app/**/*.{ts,tsx}', 'apps/web/src/providers/**/*.{ts,tsx}'],
    ignores: [
      'apps/web/src/app/api/**',
      'apps/web/src/app/(main)/actions.ts',
      'apps/web/src/app/(main)/actions.test.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', { patterns: [deepComponentImport, clientServerImport] }],
    },
  },
  {
    // Components import only their own stylesheet and write class strings of their own BEM block;
    // they are named exports so barrels, imports and searches all use the same name.
    files: ['apps/web/src/components/**/*.{ts,tsx}'],
    rules: {
      'import/no-default-export': 'error',
      'local/colocated-styles': 'error',
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
    // Fastify plugins and hooks are async by contract even when their body never awaits, and a
    // route plugin is a declarative list of routes rather than one long function.
    files: ['apps/api/src/routes/**/*.ts', 'apps/api/src/plugins/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
      'max-lines-per-function': 'off',
    },
  },
  {
    // Column order in the schema is part of the Drizzle snapshot; keep it as written.
    files: ['apps/*/src/db/schema.ts'],
    rules: { 'perfectionist/sort-objects': 'off' },
  },
  {
    files: [
      'apps/web/src/styles/theme.ts',
      'packages/shared/src/constants/palette.ts',
      'packages/shared/src/lib/patterns.ts',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['*.config.{ts,mts,js,mjs}', 'scripts/eslint-rules/**', 'scripts/stylelint-rules/**'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      'local/no-comments': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**', 'scripts/**', '*.config.{ts,mts,js,mjs}'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'prefer-arrow-functions/prefer-arrow-functions': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  {
    // Test fixtures are local data, not shared constants; stubs are allowed to be empty.
    files: ['**/*.test.{ts,tsx}', 'e2e/**'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/require-await': 'off',
      'no-restricted-syntax': 'off',
      'sonarjs/no-floating-point-equality': 'off',
    },
  },
];

export default config;
