// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { loadConfig } from './config';

describe('loadConfig', () => {
  it('uses development defaults and treats empty values as unset', () => {
    const config = loadConfig({
      COOKIE_SECURE: '',
      CORS_ORIGINS: '',
      NODE_ENV: 'development',
    });

    expect(config).toMatchObject({
      allowedOrigins: ['http://localhost:3000'],
      cookieSecure: false,
      corsOrigins: [],
      databaseUrl: null,
      docs: true,
      host: '127.0.0.1',
      port: 4000,
      sessionCookieName: 'ck_session',
      sessionDays: 30,
    });
  });

  it('switches to secure cookies and hides the docs in production', () => {
    const config = loadConfig({
      ALLOWED_ORIGINS: 'https://app.example.com, https://www.example.com',
      DATABASE_URL: 'postgresql://user:secret@db:5432/app',
      NODE_ENV: 'production',
    });

    expect(config).toMatchObject({
      allowedOrigins: ['https://app.example.com', 'https://www.example.com'],
      cookieSecure: true,
      docs: false,
      sessionCookieName: '__Host-ck_session',
    });
  });

  it('rejects invalid values', () => {
    expect(() => loadConfig({ API_PORT: 'eighty' })).toThrow();
    expect(() => loadConfig({ DATABASE_URL: 'mysql://nope' })).toThrow('postgres');
  });
});
