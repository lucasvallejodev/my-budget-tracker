import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: ['src/server.ts', 'src/cli/migrate.ts', 'src/cli/reset-password.ts'],
  format: 'esm',
  noExternal: ['@coinkeeper/shared'],
  sourcemap: true,
  target: 'node24',
});
