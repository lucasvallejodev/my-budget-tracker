import cookie from '@fastify/cookie';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type { AppConfig } from '@/config';

import { requireAuth } from './context';

const CookieOptions = (config: AppConfig) =>
  ({
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: config.cookieSecure,
  }) as const;

export const setSessionCookie = (
  reply: FastifyReply,
  config: AppConfig,
  token: string,
  expiresAt: Date
): void => {
  reply.setCookie(config.sessionCookieName, token, {
    ...CookieOptions(config),
    expires: expiresAt,
  });
};

export const clearSessionCookie = (reply: FastifyReply, config: AppConfig): void => {
  reply.clearCookie(config.sessionCookieName, CookieOptions(config));
};

export const sessionTokenOf = (request: FastifyRequest, config: AppConfig): string | undefined =>
  request.cookies[config.sessionCookieName] || undefined;

export const registerAuthentication = async (app: FastifyInstance): Promise<void> => {
  await app.register(cookie);
  app.decorateRequest('auth', null);

  app.addHook('onRequest', async (request, reply) => {
    const token = sessionTokenOf(request, app.config);

    if (!token) return;

    const session = await app.services.sessions.resolve(token);

    if (!session) {
      clearSessionCookie(reply, app.config);

      return;
    }

    request.auth = { sessionId: session.id, user: session.user };
    if (session.renewed) setSessionCookie(reply, app.config, token, session.expiresAt);
  });
};

export const requireSession = async (request: FastifyRequest): Promise<void> => {
  requireAuth(request);
};
