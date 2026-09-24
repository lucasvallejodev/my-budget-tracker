import type { InjectOptions, LightMyRequestResponse } from 'fastify';

import { type App, buildApp } from '@/app';
import { loadConfig } from '@/config';
import { HttpStatus } from '@/constants/http';

import { createTestDatabase, type TestDatabase } from './database';

export const TestOrigin = 'http://localhost:3000';
export const TestPassword = 'correct horse battery staple';

const PREFIX = '/api/v1';

type Method = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

export type TestClient = {
  cookie: string;
  request: (method: Method, path: string, body?: unknown) => Promise<LightMyRequestResponse>;
};

export type TestContext = {
  app: App;
  close: () => Promise<void>;
  database: TestDatabase;
};

export const createTestApp = async (environment: NodeJS.ProcessEnv = {}): Promise<TestContext> => {
  const database = await createTestDatabase();

  const config = loadConfig({
    ALLOWED_ORIGINS: TestOrigin,
    API_DOCS: 'true',
    AUTH_ATTEMPTS_PER_MINUTE: '1000',
    LOG_LEVEL: 'silent',
    NODE_ENV: 'test',
    ...environment,
  });

  const app = await buildApp({
    config,
    db: database.db,
    logger: false,
  });

  await app.ready();

  return {
    app,
    close: async () => {
      await app.close();
      await database.close();
    },
    database,
  };
};

export const inject = (
  app: App,
  method: Method,
  path: string,
  options: Partial<InjectOptions> = {}
): Promise<LightMyRequestResponse> =>
  app.inject({
    ...options,
    headers: { origin: TestOrigin, ...options.headers },
    method,
    url: `${PREFIX}${path}`,
  });

export const sessionCookieOf = (response: LightMyRequestResponse): string => {
  const cookie = response.cookies.find(candidate => candidate.name.endsWith('ck_session'));

  if (!cookie) throw new Error('The response did not set a session cookie');

  return `${cookie.name}=${cookie.value}`;
};

export const clientFor = (app: App, cookie: string): TestClient => ({
  cookie,
  request: (method, path, body) =>
    inject(app, method, path, {
      headers: { cookie },
      ...(body === undefined ? {} : { payload: body as InjectOptions['payload'] }),
    }),
});

export const signUp = async (app: App, email: string, name = 'Test user'): Promise<TestClient> => {
  const response = await inject(app, 'POST', '/auth/sign-up', {
    payload: {
      email,
      name,
      password: TestPassword,
    },
  });

  if (response.statusCode !== HttpStatus.created) {
    throw new Error(`Sign-up failed: ${response.body}`);
  }

  return clientFor(app, sessionCookieOf(response));
};
