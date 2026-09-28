import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';

import { HttpStatus } from '@/constants/http';
import { ServiceError } from '@/modules/db';

const SafeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const CROSS_SITE = 'cross-site';
const PLAIN_TEXT = 'text/plain';
const NO_SOURCE = "'none'";

const ApiContentSecurityPolicy = {
  directives: { defaultSrc: [NO_SOURCE], frameAncestors: [NO_SOURCE] },
  useDefaults: false,
};

const originOf = (request: FastifyRequest): string | undefined => {
  const origin = request.headers.origin;

  return typeof origin === 'string' && origin !== 'null' ? origin : undefined;
};

const rejectForeignOrigin = (allowedOrigins: string[]) => async (request: FastifyRequest) => {
  if (SafeMethods.has(request.method)) return;

  const origin = originOf(request);
  const fetchSite = request.headers['sec-fetch-site'];

  if ((origin && !allowedOrigins.includes(origin)) || (!origin && fetchSite === CROSS_SITE)) {
    throw new ServiceError(
      'Requests from this origin are not allowed',
      HttpStatus.forbidden,
      'ORIGIN_NOT_ALLOWED'
    );
  }
};

export const registerSecurity = async (app: FastifyInstance): Promise<void> => {
  const { allowedOrigins, corsOrigins } = app.config;

  app.removeContentTypeParser(PLAIN_TEXT);
  await app.register(helmet, { contentSecurityPolicy: ApiContentSecurityPolicy });
  await app.register(cors, { credentials: true, origin: corsOrigins.length ? corsOrigins : false });
  await app.register(rateLimit, { global: false });
  app.addHook('onRequest', rejectForeignOrigin([...allowedOrigins, ...corsOrigins]));
};
