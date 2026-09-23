import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { databaseUrl } from './connection';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { budgetPool?: Pool };
let database: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const pool =
    globalForDb.budgetPool ??
    new Pool({
      connectionString: databaseUrl(),
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

  if (process.env.NODE_ENV !== 'production') globalForDb.budgetPool = pool;

  return drizzle(pool, { schema });
}

export function getDb() {
  database ??= createDatabase();

  return database;
}
