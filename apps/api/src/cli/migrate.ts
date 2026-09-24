import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';

import { openRuntime } from '../environment';

const MigrationsFolder = path.resolve('drizzle');

const main = async () => {
  const { close, db } = openRuntime();

  try {
    await migrate(db, { migrationsFolder: MigrationsFolder });
    console.log(`Migrations applied from ${MigrationsFolder}.`);
  } finally {
    await close();
  }
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
