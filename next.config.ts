import type { NextConfig } from 'next';
import path from 'node:path';

const config: NextConfig = {
  output: 'standalone',
  sassOptions: { loadPaths: [path.join(process.cwd(), 'src/styles')] },
};

export default config;
