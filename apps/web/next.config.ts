import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import path from 'node:path';

const RepositoryRoot = path.join(import.meta.dirname, '..', '..');

loadEnvConfig(RepositoryRoot);

const DEFAULT_API_URL = 'http://127.0.0.1:4000';
const apiUrl = (process.env.API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');

const isDevelopment = process.env.NODE_ENV === 'development';

const ScriptSources = ["'self'", "'unsafe-inline'"];
const DevelopmentScriptSources = [...ScriptSources, "'unsafe-eval'"];

const ReportOnlyPolicyDirectives = [
  "default-src 'self'",
  `script-src ${(isDevelopment ? DevelopmentScriptSources : ScriptSources).join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

const SecurityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Content-Security-Policy-Report-Only', value: ReportOnlyPolicyDirectives.join('; ') },
];

const config: NextConfig = {
  headers: () => Promise.resolve([{ headers: SecurityHeaders, source: '/:path*' }]),
  output: 'standalone',
  outputFileTracingRoot: RepositoryRoot,
  rewrites: () => Promise.resolve([{ destination: `${apiUrl}/api/:path*`, source: '/api/:path*' }]),
  sassOptions: { loadPaths: [path.join(import.meta.dirname, 'src/styles')] },
  transpilePackages: ['@coinkeeper/shared'],
};

export default config;
