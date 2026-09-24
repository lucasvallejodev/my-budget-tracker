import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import path from 'node:path';

const RepositoryRoot = path.join(import.meta.dirname, '..', '..');

loadEnvConfig(RepositoryRoot);

const config: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: RepositoryRoot,
  sassOptions: { loadPaths: [path.join(import.meta.dirname, 'src/styles')] },
  transpilePackages: ['@coinkeeper/shared'],
};

export default config;
