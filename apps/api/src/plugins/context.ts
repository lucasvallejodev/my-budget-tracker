import type { FastifyRequest } from 'fastify';

import type { AuthenticatedUser } from '@/auth/sessions';
import type { AppConfig } from '@/config';
import { HttpStatus } from '@/constants/http';
import { ServiceError } from '@/modules/db';
import type { Services } from '@/modules/services';

export type RequestAuth = {
  sessionId: string;
  user: AuthenticatedUser;
};

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyInstance {
    config: AppConfig;
    services: Services;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyRequest {
    auth: RequestAuth | null;
  }
}

export const requireAuth = (request: FastifyRequest): RequestAuth => {
  if (!request.auth) throw new ServiceError('Sign in to continue', HttpStatus.unauthorized);

  return request.auth;
};

export const userIdOf = (request: FastifyRequest): string => requireAuth(request).user.id;
