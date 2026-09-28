// @vitest-environment node
import { DrizzleQueryError, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { type App, buildApp } from '@/app';
import { loadConfig } from '@/config';
import { HttpStatus, REQUEST_ID_HEADER } from '@/constants/http';
import { inject, sessionCookieOf, TestOrigin, TestPassword } from '@/test/app';
import { createTestDatabase, type TestDatabase } from '@/test/database';

import { REDACTED } from './logging';

const DATABASE_SETUP_TIMEOUT_MS = 30_000;
const SecretEmail = 'ada-logging@example.com';
const SecretHash = '$argon2id$v=19$m=19456,t=2,p=1$c2VjcmV0$aGFzaA';

type LogEntry = Record<string, unknown>;

let app: App;
let database: TestDatabase;
const lines: string[] = [];

const logged = (): string => lines.join('\n');
const entries = (): LogEntry[] => lines.map(line => JSON.parse(line) as LogEntry);

beforeAll(async () => {
  database = await createTestDatabase();
  app = await buildApp({
    config: loadConfig({
      ALLOWED_ORIGINS: TestOrigin,
      AUTH_ATTEMPTS_PER_MINUTE: '1000',
      LOG_LEVEL: 'info',
      NODE_ENV: 'test',
    }),
    db: database.db,
    logger: { stream: { write: line => lines.push(line) } },
  });
  app.get('/failing-query', async () =>
    app.services.db.execute(
      sql`SELECT * FROM "no_such_table" WHERE "email" = ${SecretEmail} AND "hash" = ${SecretHash}`
    )
  );
  await app.ready();
}, DATABASE_SETUP_TIMEOUT_MS);

afterAll(async () => {
  await app.close();
  await database.close();
});

describe('logging', () => {
  it('tags lines with the request id and the user, never the cookie, password or email', async () => {
    const signUp = await inject(app, 'POST', '/auth/sign-up', {
      payload: {
        email: SecretEmail,
        name: 'Ada',
        password: TestPassword,
      },
    });

    const cookie = sessionCookieOf(signUp);
    const me = await inject(app, 'GET', '/me', { headers: { cookie } });
    const requestId = me.headers[REQUEST_ID_HEADER];

    const completed = entries().find(
      entry => entry.reqId === requestId && entry.msg === 'request completed'
    );

    expect(completed).toMatchObject({ userId: me.json<{ id: string }>().id });
    expect(logged()).not.toContain(TestPassword);
    expect(logged()).not.toContain(cookie.split('=')[1]);
    expect(logged()).not.toContain(SecretEmail);
  });

  it('redacts secret headers and fields that code logs by mistake', () => {
    app.log.info(
      {
        body: { password: TestPassword, user: { newPassword: TestPassword } },
        headers: { authorization: 'Bearer abc', cookie: 'ck_session=abc' },
        tokenHash: 'hash',
        upstream: { headers: { 'set-cookie': 'ck_session=abc' } },
      },
      'probe'
    );

    expect(entries().find(entry => entry.msg === 'probe')).toMatchObject({
      body: { password: REDACTED, user: { newPassword: REDACTED } },
      headers: { authorization: REDACTED, cookie: REDACTED },
      tokenHash: REDACTED,
      upstream: { headers: { 'set-cookie': REDACTED } },
    });
  });

  it('logs a failed query with its SQL but without the values bound to it', async () => {
    const response = await app.inject({ method: 'GET', url: '/failing-query' });

    const failure = entries().find(
      entry => entry.reqId === response.headers[REQUEST_ID_HEADER] && entry.level === 50
    );

    expect(response.statusCode).toBe(HttpStatus.internalError);
    expect(failure).toMatchObject({
      err: { message: expect.stringContaining('"no_such_table"') },
      msg: 'Request failed',
    });
    expect(logged()).not.toContain(SecretEmail);
    expect(logged()).not.toContain(SecretHash);
  });

  it('strips bound values from failed-query errors logged directly, message included', () => {
    const cause = Object.assign(new Error('duplicate key value violates unique constraint'), {
      code: '23505',
      detail: `Key (email)=(${SecretEmail}) already exists.`,
    });

    app.log.error(
      new DrizzleQueryError('SELECT * FROM "users" WHERE "email" = $1', [SecretEmail], cause)
    );

    expect(entries().at(-1)).toMatchObject({
      err: {
        message:
          'Failed query: SELECT * FROM "users" WHERE "email" = $1: duplicate key value violates unique constraint',
      },
      msg: 'Failed query: SELECT * FROM "users" WHERE "email" = $1',
    });
    expect(logged()).not.toContain(SecretEmail);
  });
});
