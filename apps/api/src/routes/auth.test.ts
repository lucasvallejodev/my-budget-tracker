// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  clientFor,
  createTestApp,
  inject,
  sessionCookieOf,
  signUp,
  TestContext,
  TestPassword,
} from '@/test/app';

let context: TestContext;

beforeAll(async () => {
  context = await createTestApp();
}, 30000);
afterAll(async () => {
  await context.close();
});
beforeEach(async () => {
  await context.database.reset();
});

describe('sign-up and sign-in', () => {
  it('creates the user, seeds their data and starts a session in an HttpOnly cookie', async () => {
    const response = await inject(context.app, 'POST', '/auth/sign-up', {
      payload: {
        email: ' Ada@Example.com ',
        name: 'Ada',
        password: TestPassword,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ email: 'ada@example.com', name: 'Ada' });

    const [cookie] = response.cookies;

    expect(cookie).toMatchObject({
      httpOnly: true,
      name: 'ck_session',
      path: '/',
      sameSite: 'Lax',
    });

    const client = clientFor(context.app, sessionCookieOf(response));

    expect((await client.request('GET', '/me')).json()).toMatchObject({ email: 'ada@example.com' });
    expect((await client.request('GET', '/settings')).json()).toEqual({
      locale: 'en-US',
      primaryCurrency: 'EUR',
      showConvertedTotals: false,
    });
    expect((await client.request('GET', '/category-groups')).json().items.length).toBeGreaterThan(
      0
    );
  });

  it('rejects a taken email, a short password and a malformed email', async () => {
    await signUp(context.app, 'ada@example.com');

    const taken = await inject(context.app, 'POST', '/auth/sign-up', {
      payload: { email: 'ADA@example.com', password: TestPassword },
    });

    expect(taken.statusCode).toBe(409);
    expect(taken.json().error.code).toBe('EMAIL_TAKEN');

    const short = await inject(context.app, 'POST', '/auth/sign-up', {
      payload: { email: 'bob@example.com', password: 'short' },
    });

    expect(short.statusCode).toBe(400);
    expect(short.json().error).toMatchObject({ code: 'INVALID_REQUEST' });
    expect(short.json().error.fields.password).toBeDefined();

    const malformed = await inject(context.app, 'POST', '/auth/sign-up', {
      payload: { email: 'not-an-email', password: TestPassword },
    });

    expect(malformed.statusCode).toBe(400);
  });

  it('signs in with the right password only, with the same message for unknown emails', async () => {
    await signUp(context.app, 'ada@example.com');

    const wrong = await inject(context.app, 'POST', '/auth/sign-in', {
      payload: { email: 'ada@example.com', password: 'wrong password!!' },
    });

    const unknown = await inject(context.app, 'POST', '/auth/sign-in', {
      payload: { email: 'nobody@example.com', password: TestPassword },
    });

    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.json()).toEqual(unknown.json());

    const right = await inject(context.app, 'POST', '/auth/sign-in', {
      payload: { email: 'ADA@example.com', password: TestPassword },
    });

    expect(right.statusCode).toBe(200);
    expect(right.cookies[0].value).toBeTruthy();
  });
});

describe('sessions', () => {
  it('answers 401 without a session or with an unknown token', async () => {
    expect((await inject(context.app, 'GET', '/accounts')).statusCode).toBe(401);

    const forged = await inject(context.app, 'GET', '/accounts', {
      headers: { cookie: 'ck_session=forged-token' },
    });

    expect(forged.statusCode).toBe(401);
    expect(forged.json().error.code).toBe('UNAUTHENTICATED');
  });

  it('ends the session on sign-out', async () => {
    const client = await signUp(context.app, 'ada@example.com');
    const signOut = await client.request('POST', '/auth/sign-out');

    expect(signOut.statusCode).toBe(204);
    expect((await client.request('GET', '/me')).statusCode).toBe(401);
  });

  it('lists and revokes sessions and signs other sessions out on password change', async () => {
    const first = await signUp(context.app, 'ada@example.com');

    const secondSignIn = await inject(context.app, 'POST', '/auth/sign-in', {
      payload: { email: 'ada@example.com', password: TestPassword },
    });

    const second = clientFor(context.app, sessionCookieOf(secondSignIn));
    const sessions = (await first.request('GET', '/me/sessions')).json().items;

    expect(sessions).toHaveLength(2);
    expect(sessions.filter((session: { current: boolean }) => session.current)).toHaveLength(1);

    const wrongCurrent = await first.request('PUT', '/me/password', {
      currentPassword: 'not the password',
      newPassword: 'another long password',
    });

    expect(wrongCurrent.statusCode).toBe(403);

    const changed = await first.request('PUT', '/me/password', {
      currentPassword: TestPassword,
      newPassword: 'another long password',
    });

    expect(changed.statusCode).toBe(204);
    expect((await second.request('GET', '/me')).statusCode).toBe(401);
    expect((await first.request('GET', '/me')).statusCode).toBe(200);

    const signIn = await inject(context.app, 'POST', '/auth/sign-in', {
      payload: { email: 'ada@example.com', password: 'another long password' },
    });

    const third = clientFor(context.app, sessionCookieOf(signIn));
    const current = (await third.request('GET', '/me/sessions')).json().items;
    const other = current.find((session: { current: boolean }) => !session.current);

    expect((await third.request('DELETE', `/me/sessions/${other.id}`)).statusCode).toBe(204);
    expect((await first.request('GET', '/me')).statusCode).toBe(401);
  });

  it('updates the profile and keeps emails unique', async () => {
    const ada = await signUp(context.app, 'ada@example.com');

    await signUp(context.app, 'bob@example.com');

    const renamed = await ada.request('PATCH', '/me', { name: 'Ada Lovelace' });

    expect(renamed.json()).toMatchObject({ email: 'ada@example.com', name: 'Ada Lovelace' });
    expect((await ada.request('PATCH', '/me', { email: 'bob@example.com' })).statusCode).toBe(409);
  });
});

describe('request protection', () => {
  it('rejects writes from another origin or a cross-site fetch', async () => {
    const client = await signUp(context.app, 'ada@example.com');

    const foreign = await inject(context.app, 'PATCH', '/me', {
      headers: { cookie: client.cookie, origin: 'https://evil.example' },
      payload: { name: 'Mallory' },
    });

    expect(foreign.statusCode).toBe(403);
    expect(foreign.json().error.code).toBe('ORIGIN_NOT_ALLOWED');

    const crossSite = await context.app.inject({
      headers: { cookie: client.cookie, 'sec-fetch-site': 'cross-site' },
      method: 'PATCH',
      payload: { name: 'Mallory' },
      url: '/api/v1/me',
    });

    expect(crossSite.statusCode).toBe(403);

    const script = await context.app.inject({
      headers: { cookie: client.cookie },
      method: 'PATCH',
      payload: { name: 'Script' },
      url: '/api/v1/me',
    });

    expect(script.statusCode).toBe(200);
  });

  it('sends no CORS headers to other origins and sets security headers', async () => {
    const response = await inject(context.app, 'GET', '/health', {
      headers: { origin: 'https://evil.example' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('answers unknown routes with the error shape', async () => {
    const response = await inject(context.app, 'GET', '/nothing-here');

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });

  it('publishes the OpenAPI document', async () => {
    const response = await context.app.inject({ method: 'GET', url: '/api/docs/json' });

    expect(response.statusCode).toBe(200);
    expect(Object.keys(response.json().paths)).toContain('/api/v1/transactions');
  });
});

describe('rate limiting', () => {
  it('limits sign-in attempts per minute', async () => {
    const limited = await createTestApp({ AUTH_ATTEMPTS_PER_MINUTE: '2' });

    try {
      const attempt = () =>
        inject(limited.app, 'POST', '/auth/sign-in', {
          payload: { email: 'ada@example.com', password: TestPassword },
        });

      expect((await attempt()).statusCode).toBe(401);
      expect((await attempt()).statusCode).toBe(401);

      const blocked = await attempt();

      expect(blocked.statusCode).toBe(429);
      expect(blocked.json().error.code).toBe('RATE_LIMITED');
    } finally {
      await limited.close();
    }
  }, 30000);
});
