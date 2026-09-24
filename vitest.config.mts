import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/*.test.{ts,tsx}', '**/*.config.{ts,mts}', '**/.next/**'],
      include: ['apps/*/src/**', 'packages/*/src/**'],
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
