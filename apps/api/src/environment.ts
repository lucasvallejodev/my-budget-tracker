import { config as loadEnvironmentFile } from 'dotenv';
import path from 'node:path';

import { type AppConfig, loadConfig } from './config';
import { createDatabase } from './db';

const RepositoryEnvironmentFile = path.resolve('..', '..', '.env');

export const openRuntime = (): {
  close: () => Promise<void>;
  config: AppConfig;
  db: ReturnType<typeof createDatabase>['db'];
} => {
  loadEnvironmentFile({ path: RepositoryEnvironmentFile, quiet: true });

  const config = loadConfig();

  if (!config.databaseUrl) throw new Error('DATABASE_URL is required to start the API.');

  const { close, db } = createDatabase(config.databaseUrl);

  return {
    close,
    config,
    db,
  };
};
