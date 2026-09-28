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
      trustedProxies: [],
    });
  });

  it('trusts no proxy by default and otherwise only the listed addresses', () => {
    expect(loadConfig({ NODE_ENV: 'production' }).trustedProxies).toEqual([]);
    expect(loadConfig({ TRUST_PROXY: 'false' }).trustedProxies).toEqual([]);
    expect(
      loadConfig({ TRUST_PROXY: 'loopback, 192.0.2.0/24, 198.51.100.7, 2001:db8::/32' })
        .trustedProxies
    ).toEqual(['loopback', '192.0.2.0/24', '198.51.100.7', '2001:db8::/32']);
  });

  it('refuses to trust every proxy and rejects entries that are not addresses', () => {
    expect(() => loadConfig({ TRUST_PROXY: 'true' })).toThrow('TRUST_PROXY must be false');

    for (const invalid of [
      '1',
      'web',
      '192.0.2.0/33',
      '192.0.2.0/',
      '192.0.2.0/24/1',
      '2001:db8::/129',
    ]) {
      expect(() => loadConfig({ TRUST_PROXY: invalid }), invalid).toThrow('TRUST_PROXY');
    }
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

  it('limits every request to a handler timeout within its bounds', () => {
    expect(loadConfig({}).handlerTimeoutMs).toBe(20_000);
    expect(loadConfig({ HANDLER_TIMEOUT_MS: '45000' }).handlerTimeoutMs).toBe(45_000);

    for (const invalid of ['0', '999', '120001', 'slow']) {
      expect(() => loadConfig({ HANDLER_TIMEOUT_MS: invalid }), invalid).toThrow();
    }
  });

  it('caps session age and failed sign-ins per account within their bounds', () => {
    expect(loadConfig({})).toMatchObject({ sessionMaxAgeDays: 90, signInFailuresPerAccount: 5 });
    expect(
      loadConfig({
        SESSION_DAYS: '7',
        SESSION_MAX_AGE_DAYS: '7',
        SIGN_IN_FAILURES_PER_ACCOUNT: '5',
      })
    ).toMatchObject({
      sessionDays: 7,
      sessionMaxAgeDays: 7,
      signInFailuresPerAccount: 5,
    });
    expect(() => loadConfig({ SESSION_DAYS: '60', SESSION_MAX_AGE_DAYS: '30' })).toThrow(
      'SESSION_MAX_AGE_DAYS must be at least SESSION_DAYS'
    );

    for (const invalid of ['0', '366', 'forever']) {
      expect(() => loadConfig({ SESSION_MAX_AGE_DAYS: invalid }), invalid).toThrow();
    }

    for (const invalid of ['0', '101', 'many']) {
      expect(() => loadConfig({ SIGN_IN_FAILURES_PER_ACCOUNT: invalid }), invalid).toThrow();
    }
  });

  it('rejects invalid values', () => {
    expect(() => loadConfig({ API_PORT: 'eighty' })).toThrow();
    expect(() => loadConfig({ DATABASE_URL: 'mysql://nope' })).toThrow('postgres');
  });
});
