import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { z } from 'zod';

import { REQUEST_ID_HEADER } from '@/constants/http';

const incomingRequestIdSchema = z.uuid();

export const requestIdOf = (request: IncomingMessage): string => {
  const incoming = incomingRequestIdSchema.safeParse(request.headers[REQUEST_ID_HEADER]);

  return incoming.success ? incoming.data : randomUUID();
};

export const registerRequestId = async (app: FastifyInstance): Promise<void> => {
  app.addHook('onSend', async (request, reply) => {
    reply.header(REQUEST_ID_HEADER, request.id);
  });
};

export const registerRequestUser = async (app: FastifyInstance): Promise<void> => {
  app.addHook('onRequest', async (request, reply) => {
    if (!request.auth) return;

    request.log = request.log.child({ userId: request.auth.user.id });
    reply.log = request.log;
  });
};
