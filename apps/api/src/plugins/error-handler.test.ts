// @vitest-environment node
import Fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HttpStatus } from '@/constants/http';

import { registerErrorHandler } from './error-handler';

const failingWith = (statusCode: number) =>
  Object.assign(new Error('secret driver detail'), { statusCode });

let app: FastifyInstance;

beforeAll(async () => {
  app = Fastify({ logger: false });
  registerErrorHandler(app);
  app.get('/busy', async () => {
    throw failingWith(HttpStatus.serviceUnavailable);
  });
  app.get('/slow-query', async () => {
    throw new Error('Failed query', {
      cause: Object.assign(new Error('canceling statement'), { code: '57014' }),
    });
  });
  app.get('/broken', async () => {
    throw failingWith(HttpStatus.internalError);
  });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('error handler', () => {
  it('answers a 503 from any source as UNAVAILABLE without leaking the cause', async () => {
    const response = await app.inject({ method: 'GET', url: '/busy' });

    expect(response.statusCode).toBe(HttpStatus.serviceUnavailable);
    expect(response.json()).toEqual({
      error: { code: 'UNAVAILABLE', message: 'The service is temporarily unavailable' },
    });
  });

  it('answers a query cancelled by statement_timeout as UNAVAILABLE', async () => {
    const response = await app.inject({ method: 'GET', url: '/slow-query' });

    expect(response.statusCode).toBe(HttpStatus.serviceUnavailable);
    expect(response.json().error.code).toBe('UNAVAILABLE');
  });

  it('answers any other server error as a generic 500 INTERNAL', async () => {
    const response = await app.inject({ method: 'GET', url: '/broken' });

    expect(response.statusCode).toBe(HttpStatus.internalError);
    expect(response.json()).toEqual({ error: { code: 'INTERNAL', message: 'Unexpected error' } });
  });
});
