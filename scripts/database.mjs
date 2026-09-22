import { readSchemaSignature } from './schema-signature.mjs';
import 'dotenv/config';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const mode = process.argv[2] || 'check';
if (!['check', 'baseline'].includes(mode)) throw new Error('Use check or baseline.');
const value = process.env.DATABASE_URL;
let url;
try {
  url = new URL(value);
} catch {
  throw new Error('Set DATABASE_URL to a direct PostgreSQL connection string.');
}
if (
  !['postgres:', 'postgresql:'].includes(url.protocol) ||
  url.hostname === 'accelerate.prisma-data.net' ||
  url.searchParams.has('api_key')
)
  throw new Error(
    'DATABASE_URL must be a direct PostgreSQL connection, not an Accelerate API endpoint.'
  );

const migrations = readMigrationFiles({ migrationsFolder: './drizzle' });
// This command is intentionally limited to initial adoption, not future migrations.
if (migrations.length !== 1)
  throw new Error(
    'Initial schema verification/baselining requires exactly one migration. Use normal reviewed migrations after initial adoption.'
  );
const pool = new Pool({ connectionString: value, connectionTimeoutMillis: 10000 });
const reference = new PGlite();
let client;
try {
  for (const statement of migrations[0].sql) await reference.exec(statement);
  client = await pool.connect();
  await client.query('BEGIN');
  if (mode === 'baseline') {
    // Serialize adoption and prevent DDL/DML races while validating the initial schema.
    await client.query('SELECT pg_advisory_xact_lock(726341891)');
    await client.query(
      'LOCK TABLE "Account", "Payee", "Transaction", "MonthlyHistory", "MonthlyCategoryGroupHistory" IN SHARE MODE'
    );
  }
  const expected = await readSchemaSignature(reference);
  const actual = await readSchemaSignature(client);
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    throw new Error(
      'Schema comparison differs (columns, constraints, indexes or enums). No baseline recorded. Review the live schema before adoption.'
    );
  if (mode === 'baseline') {
    await client.query('CREATE SCHEMA IF NOT EXISTS drizzle');
    await client.query(
      'CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)'
    );
    const entries = await client.query(
      'SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at'
    );
    const first = migrations[0];
    if (
      entries.rows.length &&
      !(
        entries.rows.length === 1 &&
        entries.rows[0].hash === first.hash &&
        Number(entries.rows[0].created_at) === first.folderMillis
      )
    )
      throw new Error('An incompatible migration history already exists. No baseline recorded.');
    if (!entries.rows.length)
      await client.query(
        'INSERT INTO drizzle.__drizzle_migrations (hash,created_at) VALUES ($1,$2)',
        [first.hash, first.folderMillis]
      );
  }
  await client.query('COMMIT');
  console.log(
    mode === 'baseline'
      ? 'Existing schema verified and initial migration recorded. Application data was not changed.'
      : 'Connection and all five table schemas verified. No changes made.'
  );
} catch (error) {
  if (client) await client.query('ROLLBACK');
  // Do not print driver configuration, connection URLs, or credentials.
  console.error(
    error instanceof Error && error.message.startsWith('Schema comparison')
      ? error.message
      : `Database ${mode} failed${error.code ? ` (${error.code})` : ''}. Check connection settings and schema compatibility; no changes were committed.`
  );
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
  await reference.close();
}
