import { config as loadEnvironmentFile } from 'dotenv';
import path from 'node:path';

import { type AppConfig, loadConfig } from './config';
import { createDatabase, type DatabaseOptions, statementTimeoutFor } from './db';

const RepositoryEnvironmentFile = path.resolve('..', '..', '.env');

type Database = ReturnType<typeof createDatabase>;

export const openRuntime = (
  databaseOptions: Partial<DatabaseOptions> = {}
): {
  close: () => Promise<void>;
  config: AppConfig;
  db: Database['db'];
  reportDatabaseErrorsTo: Database['reportErrorsTo'];
} => {
  loadEnvironmentFile({ path: RepositoryEnvironmentFile, quiet: true });

  const config = loadConfig();

  if (!config.databaseUrl) throw new Error('DATABASE_URL is required to start the API.');

  const { close, db, reportErrorsTo } = createDatabase(config.databaseUrl, {
    statementTimeoutMs:
      databaseOptions.statementTimeoutMs ?? statementTimeoutFor(config.handlerTimeoutMs),
  });

  return {
    close,
    config,
    db,
    reportDatabaseErrorsTo: reportErrorsTo,
  };
};
