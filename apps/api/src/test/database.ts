import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import path from 'node:path';

import * as schema from '@/db/schema';
import { users } from '@/db/schema';
import type { Db } from '@/modules/db';

const MigrationsFolder = path.join(import.meta.dirname, '..', '..', 'drizzle');

const UNUSABLE_HASH = 'not-a-real-hash';

export type TestDatabase = {
  close: () => Promise<void>;
  db: Db;
  reset: () => Promise<void>;
};

export const createTestDatabase = async (): Promise<TestDatabase> => {
  const client = new PGlite();
  const pglite = drizzle(client, { schema });

  await migrate(pglite, { migrationsFolder: MigrationsFolder });

  return {
    close: () => client.close(),
    db: pglite as unknown as Db,
    reset: async () => {
      await client.exec('TRUNCATE users CASCADE');
    },
  };
};

export const insertUser = async (db: Db, id: string): Promise<void> => {
  await db.insert(users).values({
    email: `${id}@example.com`,
    id,
    passwordHash: UNUSABLE_HASH,
  });
};
