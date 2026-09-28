// @vitest-environment node
import { once } from 'node:events';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { type App, buildApp } from './app';
import { loadConfig } from './config';
import { HttpStatus, REQUEST_ID_HEADER, ServerTimeoutsMs } from './constants/http';
import { inject, signUp, TestOrigin } from './test/app';
import { createTestDatabase, type TestDatabase } from './test/database';

const TEST_HANDLER_TIMEOUT_MS = 1_000;
const DATABASE_SETUP_TIMEOUT_MS = 30_000;
const CallerRequestId = '0b9d7a52-2f5e-4c43-9a36-3f1c0b6f4a11';
const ApiPolicy = "default-src 'none';frame-ancestors 'none'";
const CSP_HEADER = 'content-security-policy';

const isUuid = (value: unknown): boolean => z.uuid().safeParse(value).success;

let app: App;
let database: TestDatabase;
let abortReason: unknown;

beforeAll(async () => {
  database = await createTestDatabase();
  app = await buildApp({
    config: loadConfig({
      ALLOWED_ORIGINS: TestOrigin,
      API_DOCS: 'true',
      AUTH_ATTEMPTS_PER_MINUTE: '1000',
      HANDLER_TIMEOUT_MS: String(TEST_HANDLER_TIMEOUT_MS),
      NODE_ENV: 'test',
    }),
    db: database.db,
    logger: false,
  });
  app.get('/slow', async request => {
    await once(request.signal, 'abort');
    abortReason = request.signal.reason;

    return { finished: true };
  });
  await app.ready();
}, DATABASE_SETUP_TIMEOUT_MS);

afterAll(async () => {
  await app.close();
  await database.close();
});

describe('request ids', () => {
  it('echoes a UUID sent by the caller', async () => {
    const response = await inject(app, 'GET', '/health/live', {
      headers: { [REQUEST_ID_HEADER]: CallerRequestId },
    });

    expect(response.headers[REQUEST_ID_HEADER]).toBe(CallerRequestId);
  });

  it('replaces an id that is not a UUID with a fresh one per request', async () => {
    const forged = await inject(app, 'GET', '/health/live', {
      headers: { [REQUEST_ID_HEADER]: 'abc\n{"level":60}' },
    });

    const missing = await inject(app, 'GET', '/health/live');

    expect(isUuid(forged.headers[REQUEST_ID_HEADER])).toBe(true);
    expect(isUuid(missing.headers[REQUEST_ID_HEADER])).toBe(true);
    expect(forged.headers[REQUEST_ID_HEADER]).not.toBe(missing.headers[REQUEST_ID_HEADER]);
  });

  it('adds the id to error responses and unknown routes', async () => {
    const unauthenticated = await inject(app, 'GET', '/me', {
      headers: { [REQUEST_ID_HEADER]: CallerRequestId },
    });

    const unknownRoute = await inject(app, 'GET', '/no-such-route');

    expect(unauthenticated.statusCode).toBe(HttpStatus.unauthorized);
    expect(unauthenticated.headers[REQUEST_ID_HEADER]).toBe(CallerRequestId);
    expect(unknownRoute.statusCode).toBe(HttpStatus.notFound);
    expect(isUuid(unknownRoute.headers[REQUEST_ID_HEADER])).toBe(true);
  });
});

describe('timeouts', () => {
  it('configures the server socket timeouts', () => {
    expect(app.server.keepAliveTimeout).toBe(ServerTimeoutsMs.keepAlive);
    expect(app.server.requestTimeout).toBe(ServerTimeoutsMs.request);
    expect(app.server.timeout).toBe(TEST_HANDLER_TIMEOUT_MS + ServerTimeoutsMs.connectionGrace);
  });

  it('answers 503 UNAVAILABLE and aborts the request signal when a handler runs too long', async () => {
    const response = await app.inject({ method: 'GET', url: '/slow' });

    expect(response.statusCode).toBe(HttpStatus.serviceUnavailable);
    expect(response.json()).toEqual({
      error: { code: 'UNAVAILABLE', message: 'The service is temporarily unavailable' },
    });
    expect(abortReason).toMatchObject({ code: 'FST_ERR_HANDLER_TIMEOUT' });
  });
});

describe('content security policy', () => {
  it('forbids every resource and framing on API responses', async () => {
    const response = await inject(app, 'GET', '/health/live');

    expect(response.headers[CSP_HEADER]).toBe(ApiPolicy);
  });

  it('gives the API docs a policy that lets Swagger UI load its own files', async () => {
    const page = await app.inject({ method: 'GET', url: '/api/docs' });
    const policy = String(page.headers[CSP_HEADER]);

    expect(page.statusCode).toBe(HttpStatus.ok);
    expect(policy).toContain("script-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toContain('unsafe-inline');
  });
});

describe('request bodies', () => {
  it('answers 415 to a plain-text body, even on a route without a body schema', async () => {
    const ada = await signUp(app, 'ada-bodies@example.com');

    const created = await ada.request('POST', '/accounts', {
      currency: 'EUR',
      name: 'Checking',
      type: 'checking',
    });

    const archivePath = `/accounts/${created.json<{ id: string }>().id}/archive`;

    const plainText = await inject(app, 'POST', archivePath, {
      headers: { 'content-type': 'text/plain', cookie: ada.cookie },
      payload: 'archive please',
    });

    expect(plainText.statusCode).toBe(HttpStatus.unsupportedMediaType);
    expect(plainText.json()).toEqual({
      error: { code: 'INVALID_REQUEST', message: 'Send the request body as application/json' },
    });
    expect((await ada.request('POST', archivePath)).statusCode).toBe(HttpStatus.ok);
  });
});
