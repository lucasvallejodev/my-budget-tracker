import { PGlite } from '@electric-sql/pglite';
import { config as loadEnv } from 'dotenv';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import path from 'node:path';
import { Pool } from 'pg';

import { readSchemaSignature } from './schema-signature.mjs';

const WorkspaceRoot = path.join(import.meta.dirname, '..');

loadEnv({ path: path.join(WorkspaceRoot, '..', '..', '.env'), quiet: true });

const describeCode = error => (error.code ? ` (${error.code})` : '');
const value = process.env.DATABASE_URL;
let url;

try {
  url = new URL(value);
} catch {
  throw new Error('Set DATABASE_URL to a direct PostgreSQL connection string.');
}

if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
  throw new Error('DATABASE_URL must be a direct PostgreSQL connection.');
}

const migrations = readMigrationFiles({ migrationsFolder: path.join(WorkspaceRoot, 'drizzle') });
const pool = new Pool({ connectionString: value, connectionTimeoutMillis: 10000 });
const reference = new PGlite();
let client;

try {
  for (const migration of migrations) {
    for (const statement of migration.sql) await reference.exec(statement);
  }

  client = await pool.connect();
  const expected = await readSchemaSignature(reference);
  const actual = await readSchemaSignature(client);

  const applied = await client
    .query('SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations')
    .then(result => result.rows[0].n)
    .catch(() => 0);

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error(
      `Schema comparison differs (columns, constraints, indexes or enums). ${applied}/${migrations.length} migrations recorded. Run npm run db:migrate.`
    );
  }

  console.log(`Connection and schema verified (${migrations.length} migrations). No changes made.`);
} catch (error) {
  console.error(
    error instanceof Error && error.message.startsWith('Schema comparison')
      ? error.message
      : `Database check failed${describeCode(error)}. Check connection settings and schema compatibility.`
  );
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
  await reference.close();
}
