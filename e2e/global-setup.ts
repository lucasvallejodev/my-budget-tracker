import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const ApiWorkspace = path.resolve('apps', 'api');
const EnvironmentFile = path.resolve('.env');
const SeedDemoAccountScript = path.join('src', 'cli', 'seed-demo.ts');
const TsxCli = createRequire(path.resolve('package.json')).resolve('tsx/cli');

const globalSetup = () => {
  if (existsSync(EnvironmentFile)) process.loadEnvFile(EnvironmentFile);
  process.env.DEMO_USER_PASSWORD ||= `e2e-${randomUUID()}`;

  execFileSync(process.execPath, [TsxCli, SeedDemoAccountScript], {
    cwd: ApiWorkspace,
    stdio: 'inherit',
  });
};

export default globalSetup;
