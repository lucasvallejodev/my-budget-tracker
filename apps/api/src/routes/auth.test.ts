// @vitest-environment node
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { sessions as sessionRows } from '@/db/schema';
import {
  clientFor,
  createTestApp,
  inject,
  sessionCookieOf,
  signUp,
  TestContext,
  TestPassword,
} from '@/test/app';

const PEER_ADDRESS = '192.0.2.10';
const SPOOFED_ADDRESS = '203.0.113.66';
const CLIENT_ADDRESS = '198.51.100.7';
const DAY_MS = 86_400_000;
const NEW_PASSWORD = 'another long password';
const WRONG_PASSWORD = 'wrong password!!';
const SLOWED_ATTEMPT_MIN_MS = 900;

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
      allowEmoji: false,
      locale: 'en-US',
      periodRule: { kind: 'calendar' },
      primaryCurrency: 'EUR',
      showConvertedTotals: false,
      weekendDays: [0, 6],
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

  it('lists and revokes sessions and rotates every session on password change', async () => {
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
      newPassword: NEW_PASSWORD,
    });

    expect(changed.statusCode).toBe(204);

    const rotated = clientFor(context.app, sessionCookieOf(changed));

    expect(rotated.cookie).not.toBe(first.cookie);
    expect((await second.request('GET', '/me')).statusCode).toBe(401);
    expect((await first.request('GET', '/me')).statusCode).toBe(401);
    expect((await rotated.request('GET', '/me')).statusCode).toBe(200);
    expect((await rotated.request('GET', '/me/sessions')).json().items).toHaveLength(1);

    const signIn = await inject(context.app, 'POST', '/auth/sign-in', {
      payload: { email: 'ada@example.com', password: NEW_PASSWORD },
    });

    const third = clientFor(context.app, sessionCookieOf(signIn));
    const current = (await third.request('GET', '/me/sessions')).json().items;
    const other = current.find((session: { current: boolean }) => !session.current);

    expect((await third.request('DELETE', `/me/sessions/${other.id}`)).statusCode).toBe(204);
    expect((await rotated.request('GET', '/me')).statusCode).toBe(401);
  });

  it('never reuses a session cookie the browser already holds when signing in', async () => {
    const chosen = 'ck_session=attacker-chosen-token';

    const fixated = await inject(context.app, 'POST', '/auth/sign-up', {
      headers: { cookie: chosen },
      payload: { email: 'ada@example.com', password: TestPassword },
    });

    const signedUp = sessionCookieOf(fixated);

    expect(signedUp).not.toBe(chosen);

    const again = await inject(context.app, 'POST', '/auth/sign-in', {
      headers: { cookie: signedUp },
      payload: { email: 'ada@example.com', password: TestPassword },
    });

    const signedIn = clientFor(context.app, sessionCookieOf(again));

    expect(signedIn.cookie).not.toBe(signedUp);
    expect((await clientFor(context.app, signedUp).request('GET', '/me')).statusCode).toBe(401);
    expect((await signedIn.request('GET', '/me/sessions')).json().items).toHaveLength(1);
  });

  it('ends a session at its maximum age even while it is in use', async () => {
    const client = await signUp(context.app, 'ada@example.com');
    const now = Date.now();

    await context.database.db.update(sessionRows).set({
      createdAt: new Date(now - 91 * DAY_MS),
      expiresAt: new Date(now + 20 * DAY_MS),
      lastUsedAt: new Date(now),
    });

    const response = await client.request('GET', '/me');

    expect(response.statusCode).toBe(401);
    expect(response.cookies[0]).toMatchObject({ name: 'ck_session', value: '' });
    expect(await context.database.db.select().from(sessionRows)).toHaveLength(0);
  });

  it('renews a sliding session only up to its maximum age', async () => {
    const client = await signUp(context.app, 'ada@example.com');
    const { id: userId } = (await client.request('GET', '/me')).json();
    const now = Date.now();
    const createdAt = new Date(now - 85 * DAY_MS);
    const endOfLife = createdAt.getTime() + 90 * DAY_MS;

    await context.database.db
      .update(sessionRows)
      .set({ createdAt, expiresAt: new Date(now + DAY_MS) });

    const response = await client.request('GET', '/me');

    expect(response.statusCode).toBe(200);
    expect(response.cookies[0].expires?.getTime()).toBe(Math.floor(endOfLife / 1000) * 1000);

    const [row] = await context.database.db
      .select({ expiresAt: sessionRows.expiresAt })
      .from(sessionRows)
      .where(eq(sessionRows.userId, userId));

    expect(row.expiresAt.getTime()).toBe(endOfLife);
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
    const response = await inject(context.app, 'GET', '/health/live', {
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

  it('slows failed sign-ins per account across addresses but never locks out the right password', async () => {
    const limited = await createTestApp({ SIGN_IN_FAILURES_PER_ACCOUNT: '1' });

    try {
      await signUp(limited.app, 'ada@example.com');

      const attemptFrom = (remoteAddress: string, email: string, password: string) =>
        inject(limited.app, 'POST', '/auth/sign-in', {
          payload: { email, password },
          remoteAddress,
        });

      const timed = async (attempt: () => Promise<{ statusCode: number }>) => {
        const startedAt = Date.now();
        const { statusCode } = await attempt();

        return { elapsed: Date.now() - startedAt, statusCode };
      };

      for (const address of ['203.0.113.1', '203.0.113.2']) {
        expect((await attemptFrom(address, 'ada@example.com', WRONG_PASSWORD)).statusCode).toBe(
          401
        );
      }

      const known = await timed(() => attemptFrom('203.0.113.3', 'ADA@example.com', TestPassword));

      expect(known.statusCode).toBe(200);
      expect(known.elapsed).toBeGreaterThanOrEqual(SLOWED_ATTEMPT_MIN_MS);

      for (const address of ['203.0.113.4', '203.0.113.5']) {
        await attemptFrom(address, 'nobody@example.com', TestPassword);
      }

      const unknown = await timed(() =>
        attemptFrom('203.0.113.6', 'nobody@example.com', TestPassword)
      );

      expect(unknown.statusCode).toBe(401);
      expect(unknown.elapsed).toBeGreaterThanOrEqual(SLOWED_ATTEMPT_MIN_MS);
    } finally {
      await limited.close();
    }
  }, 30000);

  it('ignores X-Forwarded-For by default, so rotating it does not reset the limit', async () => {
    const limited = await createTestApp({ AUTH_ATTEMPTS_PER_MINUTE: '2' });

    try {
      const attemptFrom = (forwardedFor: string) =>
        inject(limited.app, 'POST', '/auth/sign-in', {
          headers: { 'x-forwarded-for': forwardedFor },
          payload: { email: 'ada@example.com', password: TestPassword },
          remoteAddress: PEER_ADDRESS,
        });

      expect((await attemptFrom('203.0.113.1')).statusCode).toBe(401);
      expect((await attemptFrom('203.0.113.2')).statusCode).toBe(401);
      expect((await attemptFrom('203.0.113.3')).statusCode).toBe(429);
    } finally {
      await limited.close();
    }
  }, 30000);
});

describe('security events', () => {
  it('logs each auth event with its outcome and never the email, password or token', async () => {
    const info = vi.spyOn(context.app.log, 'info');
    const warn = vi.spyOn(context.app.log, 'warn');

    try {
      const client = await signUp(context.app, 'ada@example.com');

      await inject(context.app, 'POST', '/auth/sign-in', {
        payload: { email: 'ada@example.com', password: WRONG_PASSWORD },
      });

      const signIn = await inject(context.app, 'POST', '/auth/sign-in', {
        payload: { email: 'ada@example.com', password: TestPassword },
      });

      const second = clientFor(context.app, sessionCookieOf(signIn));

      const [other] = (await second.request('GET', '/me/sessions'))
        .json()
        .items.filter((session: { current: boolean }) => !session.current);

      await second.request('DELETE', `/me/sessions/${other.id}`);

      const changed = await second.request('PUT', '/me/password', {
        currentPassword: TestPassword,
        newPassword: NEW_PASSWORD,
      });

      await clientFor(context.app, sessionCookieOf(changed)).request('POST', '/auth/sign-out');

      const entries = [...info.mock.calls, ...warn.mock.calls]
        .map(([entry]) => entry)
        .filter(entry => typeof entry === 'object' && entry !== null && 'audit' in entry);

      expect(entries.map(entry => (entry as { audit: string }).audit)).toEqual([
        'signed_up',
        'signed_in',
        'session_revoked',
        'password_changed',
        'signed_out',
        'sign_in_failed',
      ]);
      expect(entries).toContainEqual(
        expect.objectContaining({ audit: 'sign_in_failed', reason: 'INVALID_CREDENTIALS' })
      );

      const logged = JSON.stringify(entries);

      for (const secret of [
        'ada@example.com',
        TestPassword,
        NEW_PASSWORD,
        WRONG_PASSWORD,
        client.cookie.split('=')[1],
      ]) {
        expect(logged).not.toContain(secret);
      }
    } finally {
      info.mockRestore();
      warn.mockRestore();
    }
  });
});

describe('client address', () => {
  const sessionAddressAfterSignUp = async (app: TestContext['app'], forwardedFor: string) => {
    const response = await inject(app, 'POST', '/auth/sign-up', {
      headers: { 'x-forwarded-for': forwardedFor },
      payload: { email: 'ada@example.com', password: TestPassword },
      remoteAddress: PEER_ADDRESS,
    });

    const client = clientFor(app, sessionCookieOf(response));
    const [session] = (await client.request('GET', '/me/sessions')).json().items;

    return session.ipAddress;
  };

  it('uses the connection address, not a spoofed X-Forwarded-For, under the default config', async () => {
    expect(await sessionAddressAfterSignUp(context.app, SPOOFED_ADDRESS)).toBe(PEER_ADDRESS);
  });

  it('reads the address the trusted proxy saw when the peer is listed in TRUST_PROXY', async () => {
    const proxied = await createTestApp({ TRUST_PROXY: '192.0.2.0/24' });

    try {
      const forwardedFor = `${SPOOFED_ADDRESS}, ${CLIENT_ADDRESS}`;

      expect(await sessionAddressAfterSignUp(proxied.app, forwardedFor)).toBe(CLIENT_ADDRESS);
    } finally {
      await proxied.close();
    }
  }, 30000);
});
