import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { databaseUrl } from './connection';

const globalForDb = globalThis as unknown as { budgetPool?: Pool };
let database: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const pool =
    globalForDb.budgetPool ??
    new Pool({
      connectionString: databaseUrl(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

  if (process.env.NODE_ENV !== 'production') globalForDb.budgetPool = pool;

  return drizzle(pool, { schema });
}

// Lazy initialization keeps builds and isolated tests independent of database credentials.
export function getDb() {
  database ??= createDatabase();

  return database;
}
