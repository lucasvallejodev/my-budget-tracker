import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import path from 'node:path';

loadEnv({ path: path.resolve('..', '..', '.env'), quiet: true });

export default defineConfig({
  dbCredentials: { url: process.env.DATABASE_URL || '' },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/db/schema.ts',
  strict: true,
  verbose: true,
});
