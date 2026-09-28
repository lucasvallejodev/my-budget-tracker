import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/*.test.{ts,tsx}', '**/*.config.{ts,mts}', '**/.next/**'],
      include: ['apps/*/src/**', 'packages/*/src/**'],
      // Floors sit just below the coverage measured on 2026-09-28 so it cannot drop silently.
      // `npm run test:coverage` (and the SonarQube workflow) fails below them. Raise a floor
      // when coverage rises; never lower one without saying why in the pull request.
      thresholds: {
        'apps/api/src/**': {
          branches: 80,
          functions: 92,
          lines: 91,
          statements: 90,
        },
        'apps/api/src/modules/**': {
          branches: 81,
          functions: 98,
          lines: 95,
          statements: 92,
        },
        'apps/web/src/**': {
          branches: 65,
          functions: 64,
          lines: 76,
          statements: 74,
        },
        'apps/web/src/lib/**': {
          branches: 98,
          functions: 98,
          lines: 98,
          statements: 98,
        },
        branches: 74,
        functions: 76,
        lines: 85,
        'packages/shared/src/**': {
          branches: 95,
          functions: 99,
          lines: 98,
          statements: 98,
        },
        'packages/shared/src/lib/**': {
          branches: 95,
          functions: 100,
          lines: 99,
          statements: 99,
        },
        statements: 84,
      },
    },
    projects: [
      'apps/*',
      'packages/*',
      {
        test: {
          environment: 'node',
          include: ['scripts/**/*.test.mjs'],
          name: 'tooling',
        },
      },
    ],
  },
});
