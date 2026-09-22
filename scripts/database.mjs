import { readSchemaSignature } from './schema-signature.mjs';
import 'dotenv/config';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { readMigrationFiles } from 'drizzle-orm/migrator';

// Read-only check: applies every migration to an in-memory PostgreSQL and compares the resulting
// schema (columns, constraints, indexes, enums) with the live database. Never changes anything.
const value = process.env.DATABASE_URL;
let url;
try {
  url = new URL(value);
} catch {
  throw new Error('Set DATABASE_URL to a direct PostgreSQL connection string.');
}
if (!['postgres:', 'postgresql:'].includes(url.protocol))
  throw new Error('DATABASE_URL must be a direct PostgreSQL connection.');

const migrations = readMigrationFiles({ migrationsFolder: './drizzle' });
const pool = new Pool({ connectionString: value, connectionTimeoutMillis: 10000 });
const reference = new PGlite();
let client;
try {
  for (const migration of migrations)
    for (const statement of migration.sql) await reference.exec(statement);
  client = await pool.connect();
  const expected = await readSchemaSignature(reference);
  const actual = await readSchemaSignature(client);
  const applied = await client
    .query('SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations')
    .then(r => r.rows[0].n)
    .catch(() => 0);
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    throw new Error(
      `Schema comparison differs (columns, constraints, indexes or enums). ${applied}/${migrations.length} migrations recorded. Run npm run db:migrate.`
    );
  console.log(`Connection and schema verified (${migrations.length} migrations). No changes made.`);
} catch (error) {
  console.error(
    error instanceof Error && error.message.startsWith('Schema comparison')
      ? error.message
      : `Database check failed${error.code ? ` (${error.code})` : ''}. Check connection settings and schema compatibility.`
  );
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
  await reference.close();
}
